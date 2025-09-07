import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CreateGame from "@/pages/create-game";
import JoinGame from "@/pages/join-game";
import Lobby from "@/pages/lobby";
import Game from "@/pages/game";
import Stats from "@/pages/stats";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-game" component={CreateGame} />
      <Route path="/join-game" component={JoinGame} />
      <Route path="/lobby/:roomId" component={Lobby} />
      <Route path="/game/:roomId" component={Game} />
      <Route path="/stats" component={Stats} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
