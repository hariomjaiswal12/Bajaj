import React, { useState } from 'react';
import TicketCard from './TicketCard';
import { Inbox, PlayCircle, CheckCircle2, Archive } from 'lucide-react';

const COLUMNS = [
  {
    status: 'open',
    title: 'Open',
    icon: <Inbox size={18} style={{ color: 'var(--color-open)' }} />,
    class: 'open-col'
  },
  {
    status: 'in_progress',
    title: 'In Progress',
    icon: <PlayCircle size={18} style={{ color: 'var(--color-progress)' }} />,
    class: 'progress-col'
  },
  {
    status: 'resolved',
    title: 'Resolved',
    icon: <CheckCircle2 size={18} style={{ color: 'var(--color-resolved)' }} />,
    class: 'resolved-col'
  },
  {
    status: 'closed',
    title: 'Closed',
    icon: <Archive size={18} style={{ color: 'var(--color-closed)' }} />,
    class: 'closed-col'
  }
];

export const TicketBoard = ({ tickets = [], onStatusTransition, onDeleteTicket }) => {
  const [activeDropCol, setActiveDropCol] = useState(null);

  // Group tickets by status
  const groupedTickets = COLUMNS.reduce((acc, col) => {
    acc[col.status] = tickets.filter(t => t.status === col.status);
    return acc;
  }, {});

  // HTML5 Drag and drop handlers for column drops
  const handleDragOver = (e) => {
    e.preventDefault(); // Required to allow drop!
  };

  const handleDragEnter = (e, status) => {
    e.preventDefault();
    setActiveDropCol(status);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setActiveDropCol(null);
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    setActiveDropCol(null);
    
    const ticketId = e.dataTransfer.getData('text/plain');
    if (!ticketId) return;

    onStatusTransition(ticketId, targetStatus);
  };

  return (
    <div className="kanban-board">
      {COLUMNS.map((col) => {
        const colTickets = groupedTickets[col.status] || [];
        const isOver = activeDropCol === col.status;

        return (
          <div
            key={col.status}
            className={`kanban-column glass-panel ${col.class} ${isOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            <div className="column-header">
              <span className="column-title">
                {col.icon}
                <span>{col.title}</span>
              </span>
              <span className="column-count">{colTickets.length}</span>
            </div>

            <div className="column-cards">
              {colTickets.length === 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '120px',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  marginTop: '0.5rem',
                  padding: '1rem',
                  textAlign: 'center'
                }}>
                  Drop tickets here
                </div>
              ) : (
                colTickets.map(ticket => (
                  <TicketCard
                    key={ticket._id}
                    ticket={ticket}
                    onStatusTransition={onStatusTransition}
                    onDeleteTicket={onDeleteTicket}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TicketBoard;
