import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ContestantCard, { Contestant } from "@/components/ContestantCard";
import Layout from "@/components/Layout";
import { Search, Filter, ChevronDown, Trophy, Frown } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = "http://localhost:5000";

const africanCountries = [
  "All Countries",
  "Ghana", "Nigeria", "Senegal", "Kenya", "Egypt", "Mali", "South Africa"
];

const Contestants = () => {
  const { authToken } = useAuth();
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [filteredContestants, setFilteredContestants] = useState<Contestant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [country, setCountry] = useState("All Countries");
  const [sortOrder, setSortOrder] = useState("votes-desc");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContestants = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/contestants`, {
        headers: {
          'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: Contestant[] = await response.json();
      setContestants(data);
      setFilteredContestants(data);
    } catch (err) {
      console.error("Error fetching contestants:", err);
      setError("Failed to load contestants. Please try again later. " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchContestants();
  }, [fetchContestants]);

  const sortContestants = (contestants: Contestant[], order: string) => {
    const sorted = [...contestants];
    switch (order) {
      case "votes-desc": return sorted.sort((a, b) => b.votes - a.votes);
      case "votes-asc": return sorted.sort((a, b) => a.votes - b.votes);
      case "name-asc": return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc": return sorted.sort((a, b) => b.name.localeCompare(a.name));
      default: return sorted;
    }
  };

  const applyFiltersAndSort = useCallback(() => {
    let results = [...contestants];

    if (searchTerm) {
      results = results.filter(
        contestant =>
          contestant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          contestant.country.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (country !== "All Countries") {
      results = results.filter(contestant => contestant.country === country);
    }

    results = sortContestants(results, sortOrder);
    setFilteredContestants(results);
  }, [searchTerm, country, contestants, sortOrder]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const handleReset = () => {
    setSearchTerm("");
    setCountry("All Countries");
    setSortOrder("votes-desc");
  };

  const handleContestantVote = useCallback((votedContestantId: number, newVoteCount: number) => {
    console.log(`Contestants Page: Handling vote for ID ${votedContestantId} with new count ${newVoteCount}`);
    setContestants(prevContestants => {
      const updatedContestants = prevContestants.map(c => 
        c.id === votedContestantId ? { ...c, votes: newVoteCount } : c
      );
      return updatedContestants;
    });
  }, []);


  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600/10 to-blue-600/10 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-8 mb-8 text-center shadow-lg overflow-hidden">
        <h1 className="text-4xl md:text-5xl font-heading font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-500 dark:from-purple-400 dark:to-blue-200 animate-fade-in-up">
          Meet Our Inspiring Contestants
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6 animate-fade-in-up delay-100">
          Discover the incredible talents and stories behind each participant. Cast your vote and help them shine!
        </p>
        <Trophy className="absolute top-4 left-4 h-16 w-16 opacity-10 text-primary animate-pulse-subtle" />
        <Trophy className="absolute bottom-4 right-4 h-16 w-16 opacity-10 text-primary animate-pulse-subtle delay-200" />
      </div>

      {/* Filters and Search Bar */}
      <div className="glass p-6 rounded-2xl mb-8 shadow-xl hover:shadow-2xl transition-shadow duration-300 transform animate-fade-in-up delay-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-full md:w-[200px] h-11 text-base">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by Country" />
            </SelectTrigger>
            <SelectContent>
              {africanCountries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full md:w-[200px] h-11 text-base">
              <ChevronDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes-desc">Most Votes</SelectItem>
              <SelectItem value="votes-asc">Least Votes</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleReset} className="h-11 w-full md:w-auto text-base hover:bg-accent hover:text-accent-foreground transition-colors">
            Reset Filters
          </Button>
        </div>

        {(searchTerm || country !== "All Countries") && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/50 animate-fade-in">
            <Filter className="h-4 w-4 text-primary-foreground/70" />
            <span className="text-sm text-foreground/70 font-semibold">
              Active Filters:
            </span>
            {searchTerm && (
              <Badge
                variant="default"
                className="px-3 py-1 text-sm font-medium rounded-full bg-primary/20 text-primary-foreground hover:bg-primary/30 cursor-pointer"
                onClick={() => setSearchTerm("")}
              >
                Search: {searchTerm} &times;
              </Badge>
            )}
            {country !== "All Countries" && (
              <Badge
                variant="default"
                className="px-3 py-1 text-sm font-medium rounded-full bg-primary/20 text-primary-foreground hover:bg-primary/30 cursor-pointer"
                onClick={() => setCountry("All Countries")}
              >
                Country: {country} &times;
              </Badge>
            )}
            <span className="text-sm text-muted-foreground ml-auto pr-2">
              Showing <span className="font-semibold text-foreground">{filteredContestants.length}</span> of <span className="font-semibold text-foreground">{contestants.length}</span> contestants
            </span>
          </div>
        )}
      </div>

      {/* Contestants Grid */}
      {error ? (
        <div className="text-center py-12 bg-red-100 dark:bg-red-900/20 rounded-xl shadow-inner text-red-700 dark:text-red-300 animate-fade-in">
          <Frown className="h-16 w-16 mx-auto mb-4 text-red-500" />
          <h3 className="text-2xl font-bold mb-2">Oops! Something Went Wrong</h3>
          <p className="text-lg mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} variant="destructive">
            Retry Loading
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-2xl bg-muted/60 h-[420px] shadow-md overflow-hidden"
            >
              <div className="h-64 w-full bg-muted/80 mb-4 rounded-t-xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-6 bg-muted/70 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-muted/70 rounded w-1/2 mx-auto"></div>
                <div className="h-4 bg-muted/70 rounded w-1/3 mx-auto"></div>
                <div className="h-10 bg-primary/30 rounded-lg w-full mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredContestants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-8">
          {filteredContestants.map((contestant) => (
            <ContestantCard 
              key={contestant.id} 
              contestant={contestant} 
              onVoteSuccess={(votedContestantId, newVoteCount) => handleContestantVote(votedContestantId, newVoteCount)} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-accent/20 rounded-xl shadow-inner text-accent-foreground animate-fade-in">
          <Frown className="h-16 w-16 mx-auto mb-4 text-accent-foreground/70" />
          <h3 className="text-2xl font-bold mb-2">No Contestants Match Your Filters</h3>
          <p className="text-lg mb-6">
            It looks like we couldn't find anyone with the current search and filter settings.
          </p>
          <Button onClick={handleReset} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Clear Filters to See All
          </Button>
        </div>
      )}

      {filteredContestants.length > 0 && filteredContestants.length < contestants.length && (
        <div className="text-center mt-10 animate-fade-in">
          <Button variant="outline" className="mx-auto text-lg px-6 py-3 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300">
            Load More <ChevronDown className="ml-2 h-5 w-5 animate-bounce-y" />
          </Button>
        </div>
      )}
    </Layout>
  );
};

export default Contestants;
