const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ]
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid priority. Allowed: low, medium, high, urgent'
      }
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['open', 'in_progress', 'resolved', 'closed'],
        message: '{VALUE} is not a valid status. Allowed: open, in_progress, resolved, closed'
      },
      default: 'open'
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Automatically handles createdAt and updatedAt
  }
);

// SLA thresholds in minutes
const SLA_TARGETS = {
  urgent: 60,      // 1 hour
  high: 240,       // 4 hours
  medium: 1440,    // 24 hours
  low: 4320        // 72 hours
};

// Virtual: ageMinutes
TicketSchema.virtual('ageMinutes').get(function () {
  const end = this.resolvedAt ? new Date(this.resolvedAt) : new Date();
  const start = new Date(this.createdAt);
  return Math.max(0, Math.floor((end - start) / 1000 / 60));
});

// Virtual: slaBreached
TicketSchema.virtual('slaBreached').get(function () {
  const age = this.ageMinutes;
  const target = SLA_TARGETS[this.priority];
  if (!target) return false;
  return age > target;
});

// Make sure virtuals are serialized to JSON
TicketSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret.id; // Hide the duplicated id field if any
    return ret;
  }
});

TicketSchema.set('toObject', {
  virtuals: true
});

module.exports = mongoose.model('Ticket', TicketSchema);
