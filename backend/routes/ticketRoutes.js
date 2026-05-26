const express = require('express');
const router = express.Router();
const {
  createTicket,
  getAllTickets,
  updateTicket,
  deleteTicket,
  getStats
} = require('../controllers/ticketController');

// Routes for base path (/tickets)
router.route('/')
  .post(createTicket)
  .get(getAllTickets);

// Specific route for stats (/tickets/stats)
router.get('/stats', getStats);

// Routes with dynamic IDs (/tickets/:id)
router.route('/:id')
  .patch(updateTicket)
  .delete(deleteTicket);

module.exports = router;
