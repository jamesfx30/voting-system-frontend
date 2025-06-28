import { useState } from "react"; // No longer need useEffect for this file
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// import ContestantCard, { Contestant } from "@/components/ContestantCard"; // No longer needed
import Layout from "@/components/Layout";
import { ArrowRight, ChevronRight, Clock, Globe, Users } from "lucide-react";

const Index = () => {
  const [daysRemaining] = useState(15);
  // Removed state and useEffect related to featuredContestants as they are no longer displayed

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 rounded-2xl mb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
        
        <div className="relative flex flex-col items-center text-center px-4 sm:px-6">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 animate-pulse-slow">
            Voting Now Open
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 animate-scale-in">
            Miss Bloom <span className="text-primary">Global</span> 2025
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8 animate-fade-in">
            Cast your vote and help crown the next global ambassador of beauty, grace, and purpose. Your voice matters in this worldwide celebration.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
            <Button asChild size="lg" className="bg-primary text-primary-foreground shadow hover-scale">
              <Link to="/contestants">
                Vote Now <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/rules">
                View Rules <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 w-full max-w-3xl">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-border/50 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Voting Closes In</h3>
              <p className="text-2xl font-bold text-primary">{daysRemaining} Days</p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-border/50 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Contestants</h3>
              <p className="text-2xl font-bold text-primary">48</p> {/* This static number is fine for a general overview */}
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-border/50 flex flex-col items-center text-center">
              <div className="bg-primary/10 p-3 rounded-full mb-3">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-medium mb-1">Countries</h3>
              <p className="text-2xl font-bold text-primary">32</p> {/* This static number is fine for a general overview */}
            </div>
          </div>
        </div>
      </section>
      
      {/* Removed "Featured Contestants" section entirely */}
      
      {/* How It Works */}
      <section className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">How Voting Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our transparent voting system ensures a fair competition for all contestants
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass p-6 rounded-xl">
            <div className="bg-primary/10 h-12 w-12 flex items-center justify-center rounded-full mb-4">
              <span className="text-primary font-bold text-xl">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Register</h3>
            <p className="text-muted-foreground">
              Create your account to participate in the global voting process. Verification ensures voting integrity.
            </p>
          </div>
          
          <div className="glass p-6 rounded-xl">
            <div className="bg-primary/10 h-12 w-12 flex items-center justify-center rounded-full mb-4">
              <span className="text-primary font-bold text-xl">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Cast Your Vote</h3>
            <p className="text-muted-foreground">
              Each registered voter can cast one free vote per contestant. Additional votes can be purchased.
            </p>
          </div>
          
          <div className="glass p-6 rounded-xl">
            <div className="bg-primary/10 h-12 w-12 flex items-center justify-center rounded-full mb-4">
              <span className="text-primary font-bold text-xl">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Track Results</h3>
            <p className="text-muted-foreground">
              Follow live updates as votes are counted. The platform includes real-time monitoring of voting activity.
            </p>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="rounded-2xl bg-gradient-to-r from-primary/90 to-primary text-white p-8 sm:p-12 mb-8">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Make Your Voice Heard?</h2>
          <p className="text-white/80 mb-8">
            Your vote helps shape the future of global representation in beauty and purpose. Join thousands of voters worldwide in this celebration of talent and vision.
          </p>
          <Button asChild size="lg" variant="secondary" className="hover-scale">
            <Link to="/contestants">
              Start Voting Now
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;