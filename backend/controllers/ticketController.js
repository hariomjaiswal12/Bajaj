const Ticket = require('../models/Ticket');

// SLA target thresholds in minutes
const SLA_TARGETS = {
  urgent: 60,
  high: 240,
  medium: 1440,
  low: 4320
};

/**
 * @desc    Create a new support ticket
 * @route   POST /tickets
 * @access  Public
 */
const createTicket = async (req, res, next) => {
  try {
    const { subject, description, customerEmail, priority } = req.body;

    const ticket = new Ticket({
      subject,
      description,
      customerEmail,
      priority
    });

    const savedTicket = await ticket.save();
    res.status(201).json(savedTicket);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all support tickets (with filters)
 * @route   GET /tickets
 * @access  Public
 */
const getAllTickets = async (req, res, next) => {
  try {
    const { status, priority, breached } = req.query;
    let query = {};

    // 1. Apply status filter if provided
    if (status) {
      query.status = status;
    }

    // 2. Apply priority filter if provided
    if (priority) {
      query.priority = priority;
    }

    // 3. Apply SLA breach filter directly at DB level if provided
    if (breached !== undefined) {
      const isBreached = breached === 'true';
      const now = new Date();

      const priorityConditions = Object.entries(SLA_TARGETS).map(([p, t]) => {
        if (isBreached) {
          // Breached: age > target
          return {
            priority: p,
            $or: [
              {
                resolvedAt: { $ne: null },
                $expr: {
                  $gt: [
                    { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 60000] },
                    t
                  ]
                }
              },
              {
                resolvedAt: null,
                createdAt: { $lt: new Date(now.getTime() - t * 60000) }
              }
            ]
          };
        } else {
          // Not breached: age <= target
          return {
            priority: p,
            $or: [
              {
                resolvedAt: { $ne: null },
                $expr: {
                  $lte: [
                    { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 60000] },
                    t
                  ]
                }
              },
              {
                resolvedAt: null,
                createdAt: { $gte: new Date(now.getTime() - t * 60000) }
              }
            ]
          };
        }
      });

      if (query.priority) {
        // If a specific priority filter is already defined, restrict breach condition to that priority
        const matchedCond = priorityConditions.find(c => c.priority === query.priority);
        if (matchedCond) {
          query = { ...query, ...matchedCond };
        }
      } else {
        // Otherwise, allow any of the priority breach configurations
        query.$or = priorityConditions;
      }
    }

    // Sort by createdAt in descending order (newest first)
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a support ticket (with strict transition rules)
 * @route   PATCH /tickets/:id
 * @access  Public
 */
const updateTicket = async (req, res, next) => {
  try {
    const { subject, description, customerEmail, priority, status } = req.body;

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Enforce status transition validation
    if (status !== undefined && status !== ticket.status) {
      const current = ticket.status;
      const target = status;

      const allowedTransitions = {
        open: ['in_progress'],
        in_progress: ['open', 'resolved'],
        resolved: ['in_progress', 'closed'],
        closed: ['resolved']
      };

      if (!allowedTransitions[current] || !allowedTransitions[current].includes(target)) {
        return res.status(400).json({
          message: `Invalid status transition from '${current}' to '${target}'.`,
          allowedTransitions: allowedTransitions[current] || []
        });
      }

      // Automatically handle resolvedAt timestamps
      if (target === 'resolved') {
        ticket.resolvedAt = new Date();
      }

      // Automatically reset resolvedAt to null if reverting resolved -> in_progress
      if (current === 'resolved' && target === 'in_progress') {
        ticket.resolvedAt = null;
      }

      ticket.status = target;
    }

    // Update other fields
    if (subject !== undefined) ticket.subject = subject;
    if (description !== undefined) ticket.description = description;
    if (customerEmail !== undefined) ticket.customerEmail = customerEmail;
    if (priority !== undefined) ticket.priority = priority;

    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a support ticket
 * @route   DELETE /tickets/:id
 * @access  Public
 */
const deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.deleteOne();
    res.json({ message: 'Ticket deleted successfully', id: req.params.id });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard metrics & status aggregates
 * @route   GET /tickets/stats
 * @access  Public
 */
const getStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Construct breach conditions for accurate total SLA breach counts
    const breachConditions = Object.entries(SLA_TARGETS).map(([p, t]) => {
      return {
        priority: p,
        $or: [
          {
            resolvedAt: { $ne: null },
            $expr: {
              $gt: [
                { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 60000] },
                t
              ]
            }
          },
          {
            resolvedAt: null,
            createdAt: { $lt: new Date(now.getTime() - t * 60000) }
          }
        ]
      };
    });

    const [statusCounts, breachedCount] = await Promise.all([
      Ticket.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Ticket.countDocuments({ $or: breachConditions })
    ]);

    // Construct response counts ensures all statuses exist, even if 0 tickets
    const counts = {
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };

    statusCounts.forEach(item => {
      if (counts[item._id] !== undefined) {
        counts[item._id] = item.count;
      }
    });

    res.json({
      statusCounts: counts,
      breachedCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTicket,
  getAllTickets,
  updateTicket,
  deleteTicket,
  getStats
};
