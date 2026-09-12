import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useState } from 'react';

import Dashboard from '@/pages/Dashboard';
import BodyMap from '@/pages/BodyMap';
import Calendar from '@/pages/Calendar';
import Inventory from '@/pages/Inventory';
import Calculator from '@/pages/Calculator';
import Pets from '@/pages/Pets';

import { BottomNav } from '@/components/BottomNav';
import { InjectionLoggerModal } from '@/components/InjectionLoggerModal';
import { AuthGate } from '@/components/AuthGate';
import { SecurityGate } from '@/components/SecurityGate';
import AuthCallback from '@/pages/AuthCallback';
import { AuthProvider } from '@/lib/auth-context';
import { PinsProvider, usePinsStore, inventoryForPet, type InjectionLog } from '@/lib/store';
import { SecurityProvider } from '@/lib/security-context';
import { EntitlementProvider } from '@/lib/billing/entitlement-context';
import { SoftPaywallModal } from '@/components/SoftPaywallModal';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { siteLabel } from '@/lib/body-map-data';

function BodyMapRoute({
  handleOpenLogger,
}: {
  handleOpenLogger: (siteId?: string, compoundName?: string) => void;
}) {
  const { data, activePet } = usePinsStore();
  const logs = data.logs
    .filter((log) => log.petId === activePet?.id && log.siteId)
    .map((log) => ({
      id: log.id,
      siteId: log.siteId as string,
      region: (log.siteId ?? '').replace(/-/g, ' '),
      compound: log.compound,
      dose: log.dose,
      time: log.timestamp,
    }));

  return (
    <BodyMap
      onLogInjection={(siteId, compoundName) => handleOpenLogger(siteId, compoundName)}
      logs={logs}
    />
  );
}

function ProtectedRouter({
  handleOpenLogger,
  handleRequestEdit,
}: {
  handleOpenLogger: (siteId?: string, compoundName?: string) => void;
  handleRequestEdit: (log: InjectionLog) => void;
}) {
  return (
    <Switch>
      <Route path="/">
        <BodyMapRoute handleOpenLogger={handleOpenLogger} />
      </Route>
      <Route path="/body-map">
        <BodyMapRoute handleOpenLogger={handleOpenLogger} />
      </Route>
      <Route path="/dashboard">
        <Dashboard onEditLog={handleRequestEdit} />
      </Route>
      <Route path="/calendar">
        <Calendar onEditLog={handleRequestEdit} onNewLog={handleOpenLogger} />
      </Route>
      <Route path="/inventory" component={Inventory} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/pets" component={Pets} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppShell() {
  const { data, activePet } = usePinsStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [modalSiteId, setModalSiteId] = useState<string | null>(null);
  const [modalCompoundName, setModalCompoundName] = useState<string | null>(null);
  const [editLog, setEditLog] = useState<InjectionLog | null>(null);
  const [pendingEdit, setPendingEdit] = useState<InjectionLog | null>(null);

  const petInventory = inventoryForPet(data.inventory, activePet?.id ?? null);

  const handleOpenLogger = (siteId?: string, compoundName?: string) => {
    if (petInventory.length === 0) {
      toast({
        title: 'Add a medication first',
        description: 'Inventory is empty. Add a compound before logging a dose.',
      });
      setLocation('/inventory');
      return;
    }
    setEditLog(null);
    setModalSiteId(siteId ?? null);
    setModalCompoundName(compoundName ?? null);
    setIsLogModalOpen(true);
  };

  const handleRequestEdit = (log: InjectionLog) => {
    setPendingEdit(log);
  };

  const confirmEdit = () => {
    if (!pendingEdit) return;
    setEditLog(pendingEdit);
    setModalSiteId(null);
    setModalCompoundName(null);
    setPendingEdit(null);
    setIsLogModalOpen(true);
  };

  const closeLogger = () => {
    setIsLogModalOpen(false);
    setEditLog(null);
    setModalSiteId(null);
    setModalCompoundName(null);
  };

  return (
    <div className="bg-background text-foreground min-h-[100dvh] font-sans selection:bg-primary/30">
      <ProtectedRouter handleOpenLogger={handleOpenLogger} handleRequestEdit={handleRequestEdit} />
      <BottomNav onOpenLogModal={() => handleOpenLogger()} />
      <InjectionLoggerModal
        isOpen={isLogModalOpen}
        onClose={closeLogger}
        defaultSiteId={modalSiteId}
        defaultCompoundName={modalCompoundName}
        editLog={editLog}
      />
      <AlertDialog open={!!pendingEdit} onOpenChange={(open) => !open && setPendingEdit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit this dose?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingEdit
                ? `${pendingEdit.compound} · ${pendingEdit.dose} ${pendingEdit.unit}${
                    pendingEdit.siteId ? ` · ${siteLabel(pendingEdit.siteId)}` : ''
                  }`
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmEdit}>Edit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/auth/callback" component={AuthCallback} />
      <Route>
        <AuthGate>
          <SecurityProvider>
            <SecurityGate>
              <PinsProvider>
                <EntitlementProvider>
                  <AppShell />
                  <SoftPaywallModal />
                </EntitlementProvider>
              </PinsProvider>
            </SecurityGate>
          </SecurityProvider>
        </AuthGate>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <AppRoutes />
        </WouterRouter>
      </AuthProvider>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
