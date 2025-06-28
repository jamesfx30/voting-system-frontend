import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Shield } from "lucide-react";

const Rules = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            asChild 
            className="mb-4"
          >
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Contest Rules</h1>
          <p className="text-muted-foreground text-lg">
            Official rules and guidelines for the Miss Bloom Global 2025 competition.
          </p>
        </div>
        
        <div className="space-y-10">
          {/* Eligibility Section */}
          <section className="glass p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Voting Eligibility</h2>
            </div>
            
            <p className="mb-4">
              Voting is open to anyone 14 years or older worldwide, except for residents of countries with restricted territories or under trade sanctions.
            </p>
            
            <div className="bg-accent p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Special Note:</p>
              <p>Participants under 18 years may require parental consent to register and vote, depending on local regulations.</p>
            </div>
          </section>
          
          {/* Voting Process Section */}
          <section className="glass p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Voting Process</h2>
            </div>
            
            <ol className="space-y-6">
              <li className="border-b border-border/50 pb-4">
                <h3 className="font-semibold text-lg mb-2">1. Registration</h3>
                <p>Voters can register through the Miss Bloom Global website by creating an account. Verification may be required to ensure voting integrity.</p>
              </li>
              
              <li className="border-b border-border/50 pb-4">
                <h3 className="font-semibold text-lg mb-2">2. Voting Methods</h3>
                <p>Voters can cast votes through the website during the designated voting period. Where applicable, SMS voting may also be available in certain regions.</p>
              </li>
              
              <li className="border-b border-border/50 pb-4">
                <h3 className="font-semibold text-lg mb-2">3. Free Votes</h3>
                <p>Each registered voter can cast one free vote per contestant. Free votes are limited to one per voter per day.</p>
              </li>
              
              <li className="border-b border-border/50 pb-4">
                <h3 className="font-semibold text-lg mb-2">4. Paid Votes</h3>
                <p>Additional votes can be purchased through the website or mobile app. Paid votes help support the Miss Bloom Global initiative and its charitable causes.</p>
                
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-secondary p-3 rounded-lg">
                    <p className="font-semibold mb-1">Basic Pack</p>
                    <p>5 votes for $4.99</p>
                  </div>
                  
                  <div className="bg-secondary p-3 rounded-lg">
                    <p className="font-semibold mb-1">Premium Pack</p>
                    <p>15 votes for $12.99</p>
                  </div>
                  
                  <div className="bg-secondary p-3 rounded-lg">
                    <p className="font-semibold mb-1">Ultimate Pack</p>
                    <p>50 votes for $39.99</p>
                  </div>
                </div>
              </li>
              
              <li>
                <h3 className="font-semibold text-lg mb-2">5. Voting Limits</h3>
                <p>To ensure fair competition, there are daily limits on the number of votes a voter can cast for a single contestant:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Maximum 100 votes per day per contestant</li>
                  <li>Maximum 1,000 votes per week per contestant</li>
                </ul>
              </li>
            </ol>
          </section>
          
          {/* Security & Transparency Section */}
          <section className="glass p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">Security & Transparency</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Security Measures</h3>
                <p>The voting system is designed with security features to prevent tampering, hacking, or fraud. We use industry-standard encryption and authentication protocols.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Auditing</h3>
                <p>The voting process is continuously audited to ensure transparency and accuracy. An independent third-party oversees the voting tabulation.</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-2">Dispute Resolution</h3>
                <p>In case of disputes or irregularities, the Miss Bloom Global organization has established a clear process for resolving issues and ensuring fairness:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>All disputes must be submitted in writing within 48 hours of the incident</li>
                  <li>An independent panel will review all evidence before making a final decision</li>
                  <li>The organization reserves the right to disqualify votes deemed fraudulent</li>
                </ul>
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Cast Your Vote?</h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Join thousands of voters worldwide in this celebration of beauty, talent, and purpose.
            </p>
            <Button asChild size="lg" className="hover-scale">
              <Link to="/contestants">
                Vote Now
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Rules;