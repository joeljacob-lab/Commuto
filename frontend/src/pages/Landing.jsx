import { Link } from 'react-router-dom';
import { 
  TrendingDown, 
  Lock, 
  Sparkles,
  ArrowRight,
  Route
} from 'lucide-react';
import Hero from '../components/Hero';
import commutoLogo from '../assets/Commuto_ emblem.png';
import { Button } from '../components/ui/button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-accent selection:text-accent-foreground">
      {/* 21st.dev Animated Hero */}
      <Hero />

      {/* Feature Showcase Bento Grid */}
      <section className="py-16 sm:py-24 bg-card border-y border-border relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase font-mono font-bold tracking-wider text-primary bg-secondary px-3 py-1 rounded-full border border-border">
              Engineered For College Realities
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mt-4 tracking-tight">
              A peer-to-peer transit network built on campus trust.
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-3">
              Commuto addresses the exact flaws of public transport and uncoordinated private commutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Equal Split Model */}
            <div className="bg-background rounded-[var(--radius)] border border-border p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
              <div>
                <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center text-primary mb-5 border border-border">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-serif text-foreground">The Equal Split Model</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Fuel costs are divided by <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">1 + confirmedRiders</code>. 
                  Drivers are always counted as a passenger, ensuring single riders and bike pillions never foot 100% of the bill.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>costPerHeadFinal</span>
                <span className="text-primary font-bold">Frozen at 9 PM</span>
              </div>
            </div>

            {/* Bento Card 2: Corridor Matching Engine */}
            <div className="bg-background rounded-[var(--radius)] border border-border p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
              <div>
                <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center text-primary mb-5 border border-border">
                  <Route className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-serif text-foreground">Corridor Overlap Engine</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Our pure scoring algorithm measures road polyline alignment, walking radius, and departure time proximity to match riders along a driver&apos;s natural route.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>Max Walking Radius</span>
                <span className="text-foreground font-bold">&le; 2.0 km</span>
              </div>
            </div>

            {/* Bento Card 3: Escrow & Roster Lock */}
            <div className="bg-background rounded-[var(--radius)] border border-border p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors">
              <div>
                <div className="h-11 w-11 rounded-lg bg-secondary flex items-center justify-center text-primary mb-5 border border-border">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold font-serif text-foreground">Escrow Wallet Protection</h3>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  Atomic seat reservation holds provisional fare in escrow. Pre-lock cancellations receive 100% instant refunds; late no-shows forfeit to protect the driver.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>Atomic Seats</span>
                <span className="text-primary font-bold">Zero Overbooking</span>
              </div>
            </div>

          </div>

          {/* How It Works Row */}
          <div className="mt-14 bg-background/80 backdrop-blur-xs rounded-[var(--radius)] border border-border p-6 sm:p-8 shadow-xs">
            <h3 className="text-lg font-bold font-serif text-foreground mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>How a daily campus commute works</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {/* Step 1 */}
              <div className="group p-4 rounded-lg border border-transparent hover:border-border hover:bg-card/60 transition-all duration-200 ease-out space-y-1.5">
                <div className="font-mono text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform duration-200">
                  01. Midnight
                </div>
                <div className="font-semibold text-foreground text-sm">Pool Generation</div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Daily rides automatically generate from approved vehicle routes with snapshot fuel prices.
                </p>
              </div>

              {/* Step 2 */}
              <div className="group p-4 rounded-lg border border-transparent hover:border-border hover:bg-card/60 transition-all duration-200 ease-out space-y-1.5">
                <div className="font-mono text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform duration-200">
                  02. Daytime
                </div>
                <div className="font-semibold text-foreground text-sm">Atomic Booking</div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Students find corridor matches and reserve seats. Provisional share is held in escrow.
                </p>
              </div>

              {/* Step 3 */}
              <div className="group p-4 rounded-lg border border-transparent hover:border-border hover:bg-card/60 transition-all duration-200 ease-out space-y-1.5">
                <div className="font-mono text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform duration-200">
                  03. 9:00 PM
                </div>
                <div className="font-semibold text-foreground text-sm">Roster Lock</div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Headcount freezes and equal split share is finalized. Pre-lock refund window closes.
                </p>
              </div>

              {/* Step 4 */}
              <div className="group p-4 rounded-lg border border-transparent hover:border-border hover:bg-card/60 transition-all duration-200 ease-out space-y-1.5">
                <div className="font-mono text-xs font-bold text-primary group-hover:translate-x-0.5 transition-transform duration-200">
                  04. Morning
                </div>
                <div className="font-semibold text-foreground text-sm">Trip &amp; Trust</div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Driver completes trip, receiving instant escrow payout and mutual trust score updates.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Campus CTA Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Ready to stop commuting alone?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
            Join hundreds of college peers traveling your corridor every day. Sign up with your college details.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link to="/register">
              <Button size="lg" className="gap-2.5 font-semibold">
                Register <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline">
                Already Registered? Log In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2.5">
            <img
              src={commutoLogo}
              alt="Commuto"
              className="h-6 w-6 object-contain rounded-sm"
            />
            <span className="font-bold text-foreground">Commuto</span>
            <span>• MCA Final Year Project</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Natural Keys Architecture</span>
            <span>Pairwise Trust Graph</span>
            <span>OSRM Routing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}