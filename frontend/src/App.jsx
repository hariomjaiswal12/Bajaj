import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsStrip from './components/StatsStrip';
import Filters from './components/Filters';
import TicketForm from './components/TicketForm';
import TicketBoard from './components/TicketBoard';
import ticketService from './services/api';
import { Loader2 } from 'lucide-react';

export const App = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ statusCounts: {}, breachedCount: 0 });
  const [filters, setFilters] = useState({ priority: '', breached: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Elegant dynamic toast notification system
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch tickets based on active filters
  const fetchTickets = useCallback(async () => {
    try {
      const data = await ticketService.getTickets(filters);
      setTickets(data);
    } catch (error) {
      showToast(error.message || 'Error loading tickets list', 'error');
    }
  }, [filters, showToast]);

  // Fetch system statistics
  const fetchStats = useCallback(async () => {
    try {
      const data = await ticketService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  }, []);

  // Combined parallel loader
  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    await Promise.all([fetchTickets(), fetchStats()]);
    if (showLoader) setIsLoading(false);
  }, [fetchTickets, fetchStats]);

  // Trigger loading on filter changes
  useEffect(() => {
    loadData(true);
  }, [filters]);

  // Ticket creation handler
  const handleCreateTicket = async (ticketData) => {
    setIsSubmitting(true);
    try {
      await ticketService.createTicket(ticketData);
      showToast('Support ticket created successfully!', 'success');
      
      // Re-fetch entire triage board and stats in parallel
      await loadData();
      setIsSubmitting(false);
      return true;
    } catch (error) {
      showToast(error.message || 'Failed to create ticket', 'error');
      setIsSubmitting(false);
      return false;
    }
  };

  // Ticket deletion handler (optimistic UI)
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;

    const originalTickets = [...tickets];
    const originalStats = { ...stats };

    // Find ticket to compute optimistic stats correction
    const ticketToDelete = tickets.find(t => t._id === ticketId);
    if (!ticketToDelete) return;

    // 1. Optimistically remove from state
    setTickets(prev => prev.filter(t => t._id !== ticketId));

    // 2. Adjust stats optimistically
    const status = ticketToDelete.status;
    const updatedStats = { ...stats };
    if (updatedStats.statusCounts && updatedStats.statusCounts[status] > 0) {
      updatedStats.statusCounts[status]--;
    }
    setStats(updatedStats);

    try {
      await ticketService.deleteTicket(ticketId);
      showToast('Ticket deleted successfully', 'info');
      fetchStats(); // Update for absolute accurate statistics
    } catch (error) {
      // Revert state if deletion fails
      setTickets(originalTickets);
      setStats(originalStats);
      showToast(error.message || 'Failed to delete ticket', 'error');
    }
  };

  // Ticket status transition handler (Optimistic UI)
  const handleStatusTransition = async (ticketId, targetStatus) => {
    const originalTickets = [...tickets];
    const originalStats = { ...stats };

    const ticketIndex = tickets.findIndex(t => t._id === ticketId);
    if (ticketIndex === -1) return;

    const ticket = tickets[ticketIndex];
    const currentStatus = ticket.status;

    if (currentStatus === targetStatus) return;

    // Enforce transition validations on the client side before triggering
    const allowedTransitions = {
      open: ['in_progress'],
      in_progress: ['open', 'resolved'],
      resolved: ['in_progress', 'closed'],
      closed: ['resolved']
    };

    if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(targetStatus)) {
      showToast(`Invalid transition from '${currentStatus}' to '${targetStatus}'. Direct skipping not allowed!`, 'error');
      return;
    }

    // 1. Update tickets list optimistically
    const updatedTickets = [...tickets];
    const updatedTicket = { ...ticket, status: targetStatus };

    // Auto-update resolvedAt timestamp optimistically
    if (targetStatus === 'resolved') {
      updatedTicket.resolvedAt = new Date().toISOString();
    } else if (currentStatus === 'resolved' && targetStatus === 'in_progress') {
      updatedTicket.resolvedAt = null;
    }

    updatedTickets[ticketIndex] = updatedTicket;
    setTickets(updatedTickets);

    // 2. Adjust stats counts optimistically
    const updatedStats = { ...stats };
    if (updatedStats.statusCounts) {
      if (updatedStats.statusCounts[currentStatus] > 0) {
        updatedStats.statusCounts[currentStatus]--;
      }
      updatedStats.statusCounts[targetStatus] = (updatedStats.statusCounts[targetStatus] || 0) + 1;
    }
    setStats(updatedStats);

    try {
      const response = await ticketService.updateTicket(ticketId, { status: targetStatus });
      
      // Update with verified backend state
      setTickets(prev => prev.map(t => t._id === ticketId ? response : t));
      fetchStats(); // Update for absolute accurate statistics
      showToast(`Ticket moved to ${targetStatus.replace('_', ' ')}`, 'success');
    } catch (error) {
      // Revert if request fails
      setTickets(originalTickets);
      setStats(originalStats);
      showToast(error.message || 'Failed to update ticket status', 'error');
    }
  };

  return (
    <div className="app-container">
      <Header />
      
      <StatsStrip stats={stats} />

      <div className="dashboard-grid">
        <div className="sidebar">
          <Filters filters={filters} onFilterChange={setFilters} />
          <TicketForm onSubmitTicket={handleCreateTicket} isSubmitting={isSubmitting} />
        </div>

        <main className="board-container">
          {isLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '400px',
              color: 'var(--text-muted)'
            }}>
              <Loader2 className="animate-spin" size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
              <p>Fetching active tickets board...</p>
            </div>
          ) : (
            <TicketBoard
              tickets={tickets}
              onStatusTransition={handleStatusTransition}
              onDeleteTicket={handleDeleteTicket}
            />
          )}
        </main>
      </div>

      {/* Toast Alert System overlay */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
