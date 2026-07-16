import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import Dashboard from '@/pages/dashboard';
import ClaimsPage from '@/pages/claims/index';
import ClaimDetailPage from '@/pages/claims/detail';
import FarmersPage from '@/pages/farmers/index';
import FarmerProfilePage from '@/pages/farmers/detail';
import FieldsPage from '@/pages/fields/index';
import ModelInsightsPage from '@/pages/model/index';
import VerificationQueuePage from '@/pages/verification/index';
import InspectionsPage from '@/pages/inspections/index';
import AnomaliesPage from '@/pages/anomalies/index';
import WeatherPage from '@/pages/weather/index';
import DataCollectionPage from '@/pages/data-collection/index';
import AnalyticsPage from '@/pages/analytics/index';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/claims" component={ClaimsPage} />
      <Route path="/claims/:id" component={ClaimDetailPage} />
      <Route path="/farmers" component={FarmersPage} />
      <Route path="/farmers/:id" component={FarmerProfilePage} />
      <Route path="/fields" component={FieldsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/model" component={ModelInsightsPage} />
      <Route path="/verification" component={VerificationQueuePage} />
      <Route path="/inspections" component={InspectionsPage} />
      <Route path="/anomalies" component={AnomaliesPage} />
      <Route path="/data-collection" component={DataCollectionPage} />
      <Route path="/weather" component={WeatherPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;