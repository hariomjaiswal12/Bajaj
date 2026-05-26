import React, { useState, useEffect } from 'react';
import { Mail, Clock, Play, Check, AlertTriangle, CornerUpLeft, Lock, Trash2 } from 'lucide-react';

// SLA thresholds in minutes
const SLA_TARGETS = {
  urgent: 60,
  high: 240,
  medium: 1440,
  low: 4320
};

export const TicketCard = ({ ticket, onStatusTransition, onDeleteTicket }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Set up an active timer ticking every 30 seconds for unresolved tickets.
  // This keeps the displayed ages and SLA breach alerts perfectly live in real-time.
  useEffect(() => {
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return;
    }

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // 30s tick

    return () => clearInterval(interval);
  }, [ticket.status]);

  // Dynamically calculate age and breach status
  const start = new Date(ticket.createdAt);
  const end = ticket.resolvedAt ? new Date(ticket.resolvedAt) : currentTime;
  const ageMinutes = Math.max(0, Math.floor((end - start) / 1000 / 60));
  
  const target = SLA_TARGETS[ticket.priority];
  const isBreached = ageMinutes > target;

  const formatAge = (mins) => {
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours < 24) return `${hours}h ${remainingMins}m ago`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h ago`;
  };

  // Drag-and-drop integration
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', ticket._id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Add dragging class for styling visual feedback
    const element = e.currentTarget;
    element.classList.add('dragging');
    
    // Delay slightly so the drag ghost remains styled
    setTimeout(() => {
      element.style.display = 'none';
    }, 0);
  };

  const handleDragEnd = (e) => {
    const element = e.currentTarget;
    element.classList.remove('dragging');
    element.style.display = 'block';
  };

  // Determine transition triggers based on current status
  const renderActions = () => {
    switch (ticket.status) {
      case 'open':
        return (
          <button
            onClick={() => onStatusTransition(ticket._id, 'in_progress')}
            className="action-btn btn-forward"
            title="Start progress (move to In Progress)"
          >
            <Play size={12} fill="currentColor" />
            <span>Start</span>
          </button>
        );
      case 'in_progress':
        return (
          <>
            <button
              onClick={() => onStatusTransition(ticket._id, 'open')}
              className="action-btn btn-backward"
              title="Return to backlog (move to Open)"
            >
              <CornerUpLeft size={12} />
              <span>Back</span>
            </button>
            <button
              onClick={() => onStatusTransition(ticket._id, 'resolved')}
              className="action-btn btn-resolve"
              title="Resolve issue (move to Resolved)"
            >
              <Check size={12} strokeWidth={3} />
              <span>Resolve</span>
            </button>
          </>
        );
      case 'resolved':
        return (
          <>
            <button
              onClick={() => onStatusTransition(ticket._id, 'in_progress')}
              className="action-btn btn-backward"
              title="Reopen for investigations (move to In Progress)"
            >
              <CornerUpLeft size={12} />
              <span>Reopen</span>
            </button>
            <button
              onClick={() => onStatusTransition(ticket._id, 'closed')}
              className="action-btn btn-forward"
              title="Close issue (move to Closed)"
            >
              <Lock size={12} />
              <span>Close</span>
            </button>
          </>
        );
      case 'closed':
        return (
          <button
            onClick={() => onStatusTransition(ticket._id, 'resolved')}
            className="action-btn btn-backward"
            title="Revert back to Resolved status"
          >
            <CornerUpLeft size={12} />
            <span>Reopen</span>
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={`glass-card ticket-card ${isBreached ? 'breached' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <button 
        className="card-delete-btn"
        onClick={() => onDeleteTicket(ticket._id)}
        title="Delete support ticket"
      >
        <Trash2 size={14} />
      </button>

      <span className={`badge ${ticket.priority}`}>
        {ticket.priority}
      </span>

      <h4 className="card-subject" style={{ marginTop: '0.5rem' }}>{ticket.subject}</h4>
      <p className="card-desc">{ticket.description}</p>
      
      <div className="card-email">
        <Mail size={12} />
        <span>{ticket.customerEmail}</span>
      </div>

      <div className="card-footer">
        <div className="card-meta">
          <div className="age-indicator">
            <Clock size={12} />
            <span>{formatAge(ageMinutes)}</span>
          </div>
          {isBreached && (
            <div className="breached-badge">
              <AlertTriangle size={12} fill="currentColor" style={{ color: 'var(--color-breached)' }} />
              <span>SLA Breached</span>
            </div>
          )}
        </div>

        <div className="card-actions">
          {renderActions()}
        </div>
      </div>
    </div>
  );
};

export default TicketCard;
