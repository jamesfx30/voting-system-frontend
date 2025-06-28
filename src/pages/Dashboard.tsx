import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarDays, Clock, Heart, History, Info, Star, Trophy } from "lucide-react";
import axios from 'axios'; // Import axios

// INTERFACES FOR CONTESTANT AND VOTING HISTORY
interface Contestant {
  _id: string; // Assuming your backend uses _id for MongoDB documents
  name: string;
  country: string;
  age: number;
  bio: string;
  votes: number;
  image_url: string;
}

interface UserVote {
  _id: string; // Assuming your backend uses _id for MongoDB documents
  contestantId: string; // ID of the contestant voted for
  contestantName: string; // Name of the contestant (can be denormalized or fetched)
  country: string; // Country of the contestant (can be denormalized or fetched)
  date: string; // Date of the vote
  votes: number; // Number of votes cast in this transaction
  amount: number; // Amount spent for these votes
  image_url: string; // Image of the contestant (can be denormalized or fetched)
}

// Interface for Upcoming Events
interface UpcomingEvent {
  id: string; // Unique ID for the event
  title: string;
  date: string;
  daysLeft: string;
  variant?: "default" | "outline"; // Optional for badge variant
}

// Mock data for votesByDay - This can remain mock for now or be connected later if you have vote analytics API
const votesByDay = [
  { day: 'Mon', votes: 3 },
  { day: 'Tue', 'votes': 7 },
  { day: 'Wed', votes: 5 },
  { day: 'Thu', votes: 0 },
  { day: 'Fri', votes: 4 },
  { day: 'Sat', votes: 0 },
  { day: 'Sun', votes: 0 },
];

// New mock data for upcoming events
const upcomingEvents: UpcomingEvent[] = [
  { id: 'regional-finals', title: 'Regional Finals', date: 'April 25, 2023', daysLeft: '5 days left', variant: 'default' },
  { id: 'global-semi-finals', title: 'Global Semi-Finals', date: 'May 10, 2023', daysLeft: '20 days left', variant: 'outline' },
  { id: 'grand-finale', title: 'Grand Finale', date: 'May 30, 2023', daysLeft: '40 days left', variant: 'outline' },
];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  // State to hold fetched data
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [userVotingHistory, setUserVotingHistory] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState<string | null>(null); // Error state

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Contestants from your backend on port 5000
        const contestantsResponse = await axios.get('http://localhost:5000/api/contestants');
        setContestants(contestantsResponse.data);

        // NOTE: You'll also need to fetch userVotingHistory here from your backend
        // For now, I'll keep it as an empty array or you can add mock data similar to contestants
        // Example:
        // const votingHistoryResponse = await axios.get('http://localhost:5000/api/user-votes');
        // setUserVotingHistory(votingHistoryResponse.data);

        // Mock data for userVotingHistory to make it functional for now
        setUserVotingHistory([
          { _id: 'v1', contestantId: 'c1', contestantName: 'John Doe', country: 'USA', date: '2025-06-14T10:00:00Z', votes: 10, amount: 10, image_url: '/placeholder-male.jpg' },
          { _id: 'v2', contestantId: 'c2', contestantName: 'Jane Smith', country: 'Canada', date: '2025-06-13T12:00:00Z', votes: 5, amount: 5, image_url: '/placeholder-female.jpg' },
          { _id: 'v3', contestantId: 'c1', contestantName: 'John Doe', country: 'USA', date: '2025-06-12T09:00:00Z', votes: 1, amount: 0, image_url: '/placeholder-male.jpg' } // Free vote example
        ]);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later. Check your backend server and network connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []); // Empty dependency array means this runs once on component mount

  // Calculate totals based on fetched userVotingHistory
  const totalVotes = userVotingHistory.reduce((acc, curr) => acc + curr.votes, 0);
  const totalSpent = userVotingHistory.reduce((acc, curr) => acc + curr.amount, 0);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return <Layout><div className="text-center py-20">Loading dashboard...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="text-center py-20 text-red-500">{error}</div></Layout>;
  }

  // Filter for favorite contestants (example: top 2 voted contestants from fetched data)
  // This is a basic example; you might have a real 'favorites' list from your user's profile later.
  const favoriteContestants = contestants
    .sort((a, b) => b.votes - a.votes) // Sort by votes descending
    .slice(0, 2); // Take the top 2

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Dashboard</h1>
        <p className="text-muted-foreground">
          Track your voting activity and favorite contestants
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">{totalVotes}</div>
              <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">+5 today</Badge>
            </div>
            <Progress value={Math.min(100, (totalVotes / 100) * 10)} className="h-1 mt-2" /> {/* Example progress */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Amount Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${totalSpent.toFixed(2)}</div>
            <Progress value={Math.min(100, (totalSpent / 50) * 100)} className="h-1 mt-2" /> {/* Example progress */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Voting Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ends in:</span>
              <span className="font-bold ml-2">15 days</span>
            </div>
            <Progress value={50} className="h-1 mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Voting Activity</CardTitle>
                <CardDescription>Your votes over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={votesByDay}>
                      <XAxis dataKey="day" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #e2e8f0'
                        }}
                      />
                      <Bar
                        dataKey="votes"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Voting Rules</CardTitle>
                <CardDescription>Important information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Free Votes</h4>
                    <p className="text-sm text-muted-foreground">
                      One free vote per contestant
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Daily Limit</h4>
                    <p className="text-sm text-muted-foreground">
                      Maximum 50 votes per day
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Bonus Votes</h4>
                    <p className="text-sm text-muted-foreground">
                      Buy 10 votes, get 1 free
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <Button className="w-full">Purchase Votes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Voting History</CardTitle>
              <CardDescription>Your recent voting activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {userVotingHistory.length > 0 ? (
                  userVotingHistory.map((vote) => (
                    <div
                      key={vote._id} // Correctly applied key here
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={vote.image_url} alt={vote.contestantName} />
                          <AvatarFallback>{vote.contestantName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{vote.contestantName}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{vote.country}</span>
                            <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                            <span>{formatDate(vote.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-medium">{vote.votes} vote{vote.votes > 1 ? 's' : ''}</div>
                          <div className="text-sm text-muted-foreground">
                            {vote.amount > 0 ? `$${vote.amount.toFixed(2)}` : 'Free'}
                          </div>
                        </div>
                        <History className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No recent voting activity found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites" className="animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle>Favorite Contestants</CardTitle>
              <CardDescription>Contestants you've saved</CardDescription>
            </CardHeader>
           // src/pages/Dashboard.tsx

<TabsContent value="overview" className="animate-fade-in">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    {/* Your existing Voting Activity Card (lg:col-span-2) */}
    {/* Your existing Voting Rules Card */}

    {/* PASTE THE UPCOMING EVENTS CARD HERE */}
    <Card className="lg:col-span-3 bg-accent mb-8 animate-fade-in"> {/* You might want to adjust col-span here */}
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <CardTitle>Upcoming Events</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex justify-between items-center pb-4"
              style={{ borderBottom: upcomingEvents.indexOf(event) === upcomingEvents.length - 1 ? 'none' : '1px solid hsl(var(--border))' }}
            >
              <div>
                <h4 className="font-medium">{event.title}</h4>
                <p className="text-sm text-muted-foreground">{event.date}</p>
              </div>
              <Badge variant={event.variant || "default"}>{event.daysLeft}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>
          </Card>
        </TabsContent>

        <Card className="bg-accent mb-8 animate-fade-in">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <CardTitle>Upcoming Events</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* --- FIX APPLIED HERE --- */}
              {upcomingEvents.map((event) => (
                <div
                  key={event.id} // Unique key for each event item
                  className="flex justify-between items-center pb-4"
                  // Conditionally add border-b, but not for the last item
                  style={{ borderBottom: upcomingEvents.indexOf(event) === upcomingEvents.length - 1 ? 'none' : '1px solid hsl(var(--border))' }}
                >
                  <div>
                    <h4 className="font-medium">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">{event.date}</p>
                  </div>
                  <Badge variant={event.variant || "default"}>{event.daysLeft}</Badge>
                </div>
              ))}
              {/* --- END FIX --- */}
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </Layout>
  );
};

export default Dashboard;