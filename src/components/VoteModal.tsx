// src/components/VoteModal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Check,
    Info,
    CreditCard,
    Building,
    Calendar,
    AlertCircle,
    Globe
} from "lucide-react";
import type { Contestant } from "./ContestantCard";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

import { PaystackButton } from 'react-paystack';
import { useAuth } from '../contexts/AuthContext'; // Adjust path if necessary

// --- CONFIGURATION FOR PAYSTACK AND CURRENCY ---
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

const USD_TO_GHS_RATE = 10.00; // Example: 1 USD = 10.00 GHS. Adjust as needed.
// --- END CONFIGURATION ---

const API_BASE_URL = "http://localhost:5000"; // Assuming your backend is running here

interface ContestantWithCorrectedImage {
    id: number;
    name: string;
    country: string;
    age: number;
    bio: string;
    votes: number;
    image_url: string;
}

interface VoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    contestant: ContestantWithCorrectedImage;
    onVoteSuccess: (updatedContestant: ContestantWithCorrectedImage) => void;
}

const VoteModal = ({ isOpen, onClose, contestant, onVoteSuccess }: VoteModalProps) => {
    const [voteType, setVoteType] = useState<"free" | "paid">("free");
    const [voteAmount, setVoteAmount] = useState<number>(1);
    const [paymentMethod, setPaymentMethod] = useState<string>("card");
    const [isLoading, setIsLoading] = useState(false);
    const [hasVotedFree, setHasVotedFree] = useState(false);

    const [customVoteInput, setCustomVoteInput] = useState<string>('');

    const { toast } = useToast();

    const [paymentStep, setPaymentStep] = useState<"package" | "payment">("package");

    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const userEmail = user?.email || 'guest@example.com';

    useEffect(() => {
        if (!PAYSTACK_PUBLIC_KEY) {
            toast({
                title: "Configuration Error",
                description: "Paystack Public Key is missing. Payments cannot be processed.",
                variant: "destructive",
            });
        }

        if (isOpen && !authLoading) {
            const fetchFreeVoteStatus = async () => {
                const token = localStorage.getItem('authToken');

                if (!token) {
                    setVoteType('paid');
                    setCustomVoteInput('5'); // Default to 5 votes for paid tab
                    setPaymentStep("package");
                    return;
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/api/user/free-vote-status`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const data = await response.json();

                    if (response.ok) {
                        setHasVotedFree(data.has_cast_free_vote);
                        if (!data.has_cast_free_vote && voteType !== 'free') {
                            setVoteType('free');
                            setCustomVoteInput('1');
                            setVoteAmount(1);
                        } else if (data.has_cast_free_vote && voteType === 'free') {
                            setVoteType('paid');
                            setCustomVoteInput('5');
                            setVoteAmount(5);
                        }
                    } else {
                        if (response.status === 401) {
                            toast({
                                title: "Session Expired",
                                description: "Please log in again to check your free vote status.",
                                variant: "destructive",
                            });
                            localStorage.removeItem('authToken');
                        } else {
                            toast({
                                title: "Error",
                                description: data.message || "Failed to fetch free vote status.",
                                variant: "destructive",
                            });
                        }
                        setVoteType('paid');
                        setCustomVoteInput('5');
                        setPaymentStep("package");
                    }
                } catch (error) {
                    toast({
                        title: "Network Error",
                        description: "Could not connect to the server to check free vote status.",
                        variant: "destructive",
                    });
                    setVoteType('paid');
                    setCustomVoteInput('5');
                    setPaymentStep("package");
                }
            };
            fetchFreeVoteStatus();
        } else if (!isOpen) {
            resetForm(); // Reset form when modal closes
        }
    }, [isOpen, toast, voteType, authLoading, PAYSTACK_PUBLIC_KEY, isAuthenticated]);


    const handleVote = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!contestant || !contestant.id) {
            toast({
                title: "Error",
                description: "Invalid contestant ID. Cannot submit vote.",
                variant: "destructive",
            });
            return;
        }

        const token = localStorage.getItem('authToken');

        if (voteType === "free") {
            if (!isAuthenticated) {
                toast({
                    title: "Login Required",
                    description: "Please log in to cast your free vote.",
                    variant: "destructive",
                });
                return;
            }

            if (hasVotedFree) {
                toast({
                    title: "Free Vote Used!",
                    description: "You have already cast your one free vote today.",
                    variant: "destructive",
                });
                return;
            }

            setIsLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/api/contestants/${contestant.id}/vote`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({ amount: 1, voteType: 'free' }),
                });

                const data = await response.json();

                if (response.ok) {
                    toast({
                        title: "Vote Submitted!",
                        description: `You have successfully cast your free vote for ${contestant.name}.`,
                        variant: "default",
                    });
                    setHasVotedFree(true);
                    onVoteSuccess(data.contestant);
                    onClose();
                } else {
                    if (response.status === 401) {
                        toast({
                            title: "Authentication Failed",
                            description: "Your session has expired. Please log in again.",
                            variant: "destructive",
                        });
                        localStorage.removeItem('authToken');
                        onClose();
                    } else if (response.status === 403 && data.message === 'You have already cast your one-time free vote.') {
                        toast({
                            title: "Free Vote Used!",
                            description: data.message,
                            variant: "destructive",
                        });
                        setHasVotedFree(true);
                    } else {
                        toast({
                            title: "Vote Failed!",
                            description: data.message || "An error occurred while casting your free vote.",
                            variant: "destructive",
                        });
                    }
                }
            } catch (error) {
                toast({
                    title: "Network Error!",
                    description: "Could not connect to the server. Please try again.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (voteType === "paid" && paymentStep === "package") {
            const parsedVoteAmount = parseInt(customVoteInput);

            if (isNaN(parsedVoteAmount) || parsedVoteAmount <= 0) {
                toast({
                    title: "Invalid Vote Amount",
                    description: "Please enter a valid number of votes (at least 1).",
                    variant: "destructive",
                });
                return;
            }
            if (!isAuthenticated) {
                toast({
                    title: "Login Required",
                    description: "Please log in to cast a paid vote.",
                    variant: "destructive",
                });
                return;
            }

            if (!userEmail || !PAYSTACK_PUBLIC_KEY || calculateCost() <= 0) {
                toast({
                    title: "Payment Setup Error",
                    description: "Cannot proceed. Missing user email, public key, or invalid vote amount.",
                    variant: "destructive",
                });
                return;
            }

            setVoteAmount(parsedVoteAmount);
            setPaymentStep("payment");
            return;
        }
    };


    const handlePaystackSuccess = async (response: any) => {
        setIsLoading(true);
        toast({
            title: "Payment Initiated!",
            description: "Verifying your payment securely. Please wait...",
            variant: "default",
        });

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error("Authentication token not found. Please log in.");
            }

            const expectedAmountGHSInPesewas = Math.round(calculateCost() * USD_TO_GHS_RATE * 100);
            const finalPaystackAmount = expectedAmountGHSInPesewas < 100 ? 100 : expectedAmountGHSInPesewas;

            const verificationResponse = await fetch(`${API_BASE_URL}/api/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reference: response.reference,
                    contestantId: contestant.id,
                    expectedAmountUSD: voteAmount,
                    expectedAmountGHS: finalPaystackAmount,
                }),
            });

            const verificationData = await verificationResponse.json();

            if (!verificationResponse.ok) {
                throw new Error(verificationData.message || 'Payment verification failed on backend.');
            }

            toast({
                title: "Payment Verified & Votes Added!",
                description: verificationData.message || `Successfully added ${voteAmount} votes to ${contestant.name}.`,
                variant: "default",
            });
            onVoteSuccess(verificationData.contestant);
            onClose();
        } catch (error: any) {
            toast({
                title: "Payment Error",
                description: `Failed to verify payment: ${error.message || 'An unknown error occurred.'}`,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePaystackClose = () => {
        toast({
            title: "Payment Cancelled",
            description: "You closed the payment window. Your transaction was not completed.",
            variant: "default",
        });
    };

    const resetForm = () => {
        if (isAuthenticated && !hasVotedFree) {
            setVoteType("free");
            setCustomVoteInput('1');
            setVoteAmount(1);
        } else {
            setVoteType("paid");
            setCustomVoteInput('5');
            setVoteAmount(5);
        }
        setPaymentMethod("card");
        setPaymentStep("package");
        setIsLoading(false);
    };

    const calculateCost = () => {
        const parsedInput = parseFloat(customVoteInput);
        return isNaN(parsedInput) || parsedInput < 1 ? 1 : parsedInput;
    };

    let paystackAmountInPesewas = Math.round(calculateCost() * USD_TO_GHS_RATE * 100);
    if (paystackAmountInPesewas < 100) {
        paystackAmountInPesewas = 100;
    }

    const paystackMetadata = {
        contestant_id: contestant.id,
        votes_bought_usd_equivalent: calculateCost(),
        actual_amount_ghs_pesewas: paystackAmountInPesewas,
        exchange_rate_used: USD_TO_GHS_RATE,
    };

    // --- ADDED DEBUG LOGS HERE ---
    console.log("Paystack Public Key:", PAYSTACK_PUBLIC_KEY);
    console.log("Paystack Button Email:", userEmail);
    console.log("Paystack Button Amount (Pesewas):", paystackAmountInPesewas);
    console.log("Paystack Button Reference (generated):", `TX_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`); // This will differ slightly from actual prop
    console.log("Paystack Button Metadata:", paystackMetadata);
    console.log("Paystack Button isDisabled:",
        isLoading ||
        !userEmail ||
        !userEmail.includes('@') ||
        paystackAmountInPesewas < 100 ||
        !PAYSTACK_PUBLIC_KEY ||
        !Number.isInteger(paystackAmountInPesewas) || // Check the final calculated amount
        paystackAmountInPesewas <= 0
    );
    // --- END ADDED DEBUG LOGS ---

    const paystackProps = {
        email: userEmail,
        amount: paystackAmountInPesewas,
        reference: `TX_${new Date().getTime()}_${Math.floor(Math.random() * 1000)}`,
        currency: 'GHS',
        metadata: paystackMetadata,
        callback: handlePaystackSuccess,
        close: handlePaystackClose,
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                onClose();
            } else {
                resetForm(); // Ensure form resets when opened
            }
        }}>
            <DialogContent className="sm:max-w-[500px] glass max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        Vote for {contestant.name}
                    </DialogTitle>
                    <DialogDescription>
                        Your vote helps determine who will advance in the competition.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col sm:flex-row gap-4 py-2">
                    <img
                        src={API_BASE_URL + contestant.image_url}
                        alt={contestant.name}
                        className="w-full sm:w-1/2 h-48 object-cover rounded-lg shadow-md"
                    />
                    <div className="flex flex-col justify-center space-y-2 sm:w-1/2">
                        <h3 className="text-lg font-bold">{contestant.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Globe className="h-4 w-4" /> {contestant.country}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> {contestant.age} years old
                        </p>
                    </div>
                </div>

                {paymentStep === "package" && (
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold mt-4">Choose Your Vote Type</h4>
                        <Tabs
                            value={voteType}
                            onValueChange={(value) => {
                                setVoteType(value as "free" | "paid");
                                if (value === 'free') {
                                    setVoteAmount(1);
                                    setCustomVoteInput('1');
                                } else {
                                    setVoteAmount(parseInt(customVoteInput || '5') || 5);
                                    setCustomVoteInput(customVoteInput || '5');
                                }
                            }}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="free" disabled={hasVotedFree || !isAuthenticated}>
                                    Free Vote {hasVotedFree && <Check size={16} className="ml-2 text-green-500" />}
                                </TabsTrigger>
                                <TabsTrigger value="paid">Paid Vote</TabsTrigger>
                            </TabsList>
                            <TabsContent value="free" className="mt-4 animate-fade-in">
                                <Card className="border-green-300 bg-green-50">
                                    <CardHeader>
                                        <CardTitle className="text-lg font-semibold text-green-700">Your Daily Free Vote</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-green-600">
                                            Every logged-in user gets one free vote per day. Make it count!
                                        </p>
                                        {hasVotedFree && (
                                            <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                                                <AlertCircle size={14} /> You have already cast your free vote for today.
                                            </p>
                                        )}
                                        {!isAuthenticated && (
                                            <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                                                <Info size={14} /> Log in to cast your free vote.
                                            </p>
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full bg-green-500 hover:bg-green-600"
                                            onClick={handleVote}
                                            disabled={isLoading || hasVotedFree || !isAuthenticated}
                                        >
                                            {isLoading ? "Casting Free Vote..." : "Cast Free Vote"}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="paid" className="mt-4 animate-fade-in">
                                <h5 className="text-lg font-semibold mb-3">Enter Your Desired Votes</h5>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="custom-vote-amount" className="text-base">
                                            Number of Votes
                                        </Label>
                                        <Input
                                            id="custom-vote-amount"
                                            type="number"
                                            min="1"
                                            value={customVoteInput}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value === '' || /^\d+$/.test(value)) {
                                                    setCustomVoteInput(value);
                                                }
                                            }}
                                            placeholder="e.g., 10, 50, 100"
                                            className="mt-2"
                                        />
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Each vote costs $1 USD. Total cost: <span className="font-bold">${calculateCost().toFixed(2)} USD</span>
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    className="w-full mt-4"
                                    onClick={handleVote}
                                    disabled={isLoading || calculateCost() <= 0 || !isAuthenticated}
                                >
                                    Proceed to Payment (${calculateCost().toFixed(2)} USD)
                                </Button>
                                {!isAuthenticated && (
                                    <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                                        <Info size={14} /> Log in to proceed with paid voting.
                                    </p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                )}

                {paymentStep === "payment" && (
                    <Card className="mt-4 animate-fade-in">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-semibold">Complete Your Payment</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                You are purchasing <span className="font-bold">{voteAmount} votes</span> for {contestant.name}.
                                <br />
                                Total: <span className="font-bold">${calculateCost().toFixed(2)} USD</span> (approx. GHS {(paystackAmountInPesewas / 100).toFixed(2)})
                                <br />
                                <span className="text-xs text-orange-500 flex items-center gap-1">
                                    <Info size={12} /> The GHS amount is based on a fixed rate of 1 USD = {USD_TO_GHS_RATE} GHS.
                                </span>
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="card">
                                        <CreditCard className="h-4 w-4 mr-2" /> Pay with Card / Mobile Money
                                    </TabsTrigger>
                                    <TabsTrigger value="bank">
                                        <Building className="h-4 w-4 mr-2" /> Other Paystack Options
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="card" className="space-y-4 animate-fade-in mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Click the button below to complete your payment securely via Paystack.
                                        You can use your Debit/Credit card or Mobile Money.
                                    </p>
                                    <PaystackButton
                                        text={`Pay GHS ${(paystackAmountInPesewas / 100).toFixed(2)} Now`}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-200 ease-in-out"
                                        publicKey={PAYSTACK_PUBLIC_KEY || ''}
                                        {...paystackProps}
                                        disabled={
                                            isLoading ||
                                            !userEmail ||
                                            !userEmail.includes('@') ||
                                            paystackAmountInPesewas < 100 ||
                                            !PAYSTACK_PUBLIC_KEY ||
                                            !Number.isInteger(paystackProps.amount) ||
                                            paystackProps.amount <= 0
                                        }
                                    />
                                    {isLoading && (
                                        <div className="flex items-center justify-center text-sm text-muted-foreground mt-4">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing payment...
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="bank" className="space-y-4 animate-fade-in mt-4">
                                    <p className="text-sm text-muted-foreground">
                                        Paystack offers various payment options including bank transfer and other local methods.
                                        Select the 'Pay with Card / Mobile Money' tab to initiate payment, and you'll often see these options within the Paystack popup itself.
                                        <br />
                                        <br />
                                        For specific bank transfer instructions, please proceed with the Paystack popup and look for "Bank Transfer" or "USSD" options.
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </CardContent>

                        <CardFooter className="flex justify-end pb-6">
                            <Button variant="outline" onClick={() => setPaymentStep("package")} disabled={isLoading}>
                                Back to Vote Packages
                            </Button>
                        </CardFooter>
                    </Card>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default VoteModal;
