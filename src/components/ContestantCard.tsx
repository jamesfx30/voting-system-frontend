// src/components/ContestantCard.tsx

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, CalendarDays } from "lucide-react";
import VoteModal from "./VoteModal";

const API_BASE_URL = "http://localhost:5000"; // IMPORTANT: Ensure this exactly matches your backend URL

// Corrected Contestant interface to align with PostgreSQL backend (id: number)
export interface Contestant {
  id: number; // CORRECTED: Changed from '_id: string' to 'id: number' for PostgreSQL
  name: string;
  country: string;
  age: number;
  bio: string;
  votes: number;
  image_url: string; // This should be the path or full URL provided by your backend
}

interface ContestantCardProps {
  contestant: Contestant;
}

const ContestantCard = ({ contestant: initialContestant }: ContestantCardProps) => {
  const [contestant, setContestant] = useState<Contestant>(initialContestant);
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false);

  // Helper function to correctly construct the image URL
  const getImageUrl = (path: string | undefined) => {
    // 1. If no path is provided, return a placeholder image
    if (!path) {
      console.warn("Contestant image_url is missing. Using placeholder.");
      return '/placeholder-contestant.jpg'; // Make sure you have this file in your public/ folder
    }

    // 2. If the path is already a full absolute URL, use it as is
    //    (e.g., starts with http://, https://, or // for protocol-relative URLs)
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
      return path;
    }

    // 3. If it's a relative path, combine it with the API_BASE_URL.
    //    We need to handle potential leading/trailing slashes to avoid double slashes //
    const baseUrlClean = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const pathClean = path.startsWith('/') ? path.slice(1) : path;
    
    return `${baseUrlClean}/${pathClean}`;
  };

  // Callback function to handle successful vote from VoteModal
  const handleVoteSuccess = (updatedContestant: Contestant) => {
    setContestant(updatedContestant);
    setIsVoteModalOpen(false);
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
      {/* CORRECTED: Increased height to h-64. Adjust h-64 to h-72 or h-80 if you need more vertical space for taller full-body images. */}
      <div className="relative w-full h-64 overflow-hidden">
        <img
          src={getImageUrl(contestant.image_url)} // Use the robust helper function here
          alt={contestant.name}
          className="w-full h-full object-contain" // CORRECTED: Changed to object-contain for full body
          onError={(e) => { // This will fire if the image fails to load
            console.error(`Failed to load image for ${contestant.name} from ${contestant.image_url}`);
            (e.target as HTMLImageElement).src = '/placeholder-contestant.jpg'; // Fallback to placeholder
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <CardTitle className="text-2xl font-bold drop-shadow">{contestant.name}</CardTitle>
          <CardDescription className="text-sm text-gray-200 flex items-center gap-1">
            <Globe className="h-4 w-4" /> {contestant.country}
            <span className="mx-1">•</span>
            <CalendarDays className="h-4 w-4" /> {contestant.age} years
          </CardDescription>
        </div>
      </div>
      <CardContent className="p-4 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">{contestant.bio}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => setIsVoteModalOpen(true)}
          className="bg-primary text-primary-foreground shadow-sm w-full hover:bg-primary/90"
        >
          Vote Now
        </Button>
      </CardFooter>

      <VoteModal
        isOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        contestant={contestant}
        onVoteSuccess={handleVoteSuccess}
      />
    </Card>
  );
};

export default ContestantCard;