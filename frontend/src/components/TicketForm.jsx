import React, { useState } from 'react';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';

export const TicketForm = ({ onSubmitTicket, isSubmitting = false }) => {
  const [fields, setFields] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'low'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const tempErrors = {};
    
    if (!fields.subject.trim()) {
      tempErrors.subject = 'Subject is required';
    } else if (fields.subject.length > 100) {
      tempErrors.subject = 'Subject cannot exceed 100 characters';
    }

    if (!fields.description.trim()) {
      tempErrors.description = 'Description is required';
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!fields.customerEmail.trim()) {
      tempErrors.customerEmail = 'Customer email is required';
    } else if (!emailRegex.test(fields.customerEmail)) {
      tempErrors.customerEmail = 'Please enter a valid email address';
    }

    if (!fields.priority) {
      tempErrors.priority = 'Priority is required';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    // Clear field error instantly on typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    const success = await onSubmitTicket(fields);
    if (success) {
      // Clear form on success
      setFields({
        subject: '',
        description: '',
        customerEmail: '',
        priority: 'low'
      });
      setErrors({});
    }
  };

  return (
    <div className="form-container glass-panel">
      <h3 className="form-title">
        <PlusCircle size={20} style={{ color: 'var(--color-primary)' }} />
        <span>Create New Ticket</span>
      </h3>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label className="form-label" htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={fields.subject}
            onChange={handleChange}
            placeholder="Brief issue description..."
            className={`form-control ${errors.subject ? 'error' : ''}`}
            disabled={isSubmitting}
          />
          {errors.subject && (
            <span className="form-error-msg">
              <AlertCircle size={12} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} />
              {errors.subject}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={fields.description}
            onChange={handleChange}
            placeholder="Detailed issue description..."
            rows="3"
            className={`form-control ${errors.description ? 'error' : ''}`}
            disabled={isSubmitting}
            style={{ resize: 'vertical', minHeight: '80px' }}
          />
          {errors.description && (
            <span className="form-error-msg">
              <AlertCircle size={12} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} />
              {errors.description}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="customerEmail">Customer Email</label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={fields.customerEmail}
            onChange={handleChange}
            placeholder="customer@domain.com"
            className={`form-control ${errors.customerEmail ? 'error' : ''}`}
            disabled={isSubmitting}
          />
          {errors.customerEmail && (
            <span className="form-error-msg">
              <AlertCircle size={12} style={{ display: 'inline', marginRight: '2px', verticalAlign: 'middle' }} />
              {errors.customerEmail}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={fields.priority}
            onChange={handleChange}
            className="form-control"
            disabled={isSubmitting}
          >
            <option value="low">🟢 Low (72h SLA)</option>
            <option value="medium">🔵 Medium (24h SLA)</option>
            <option value="high">🟡 High (4h SLA)</option>
            <option value="urgent">🔴 Urgent (1h SLA)</option>
          </select>
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Creating...</span>
            </>
          ) : (
            <span>Submit Ticket</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default TicketForm;
