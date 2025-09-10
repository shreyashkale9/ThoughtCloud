const express = require('express');
const Note = require('../models/Note');
const jwt = require('jsonwebtoken');
const router = express.Router();

/**
 * Middleware to verify JWT and set req.user
 */
function auth(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
  
    try {
      // Use fallback JWT_SECRET if environment variable is not set
      const jwtSecret = process.env.JWT_SECRET || 'fallback_jwt_secret_for_development';
      console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded.userId;
      next();
    } catch (err) {
      console.error('JWT verification error:', err.message);
      res.status(401).json({ message: 'Token is not valid' });
    }
  }

// Create a note
router.post('/', auth, async (req, res) => {
  try {
    console.log('POST /notes - Request body:', req.body);
    console.log('POST /notes - User:', req.user);
    
    const { title, content, folder, tags, type, drawingData } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const note = new Note({ 
      user: req.user, 
      title, 
      content, 
      folder, 
      tags,
      type: type || 'text',
      drawingData: drawingData || null
    });
    
    console.log('POST /notes - Note to save:', note);
    await note.save();
    console.log('POST /notes - Note saved successfully');
    res.status(201).json(note);
  } catch (err) {
    console.error('POST /notes - Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all notes for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user }).sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @route GET /api/notes/folders
 * @desc Get all unique folders for the logged-in user
 * @access Private
 */
router.get('/folders', auth, async (req, res) => {
    try {
      const folders = await Note.distinct('folder', { user: req.user, folder: { $ne: null } });
      res.json(folders);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

/**
 * @route GET /api/notes/tags
 * @desc Get all unique tags for the logged-in user
 * @access Private
 */
router.get('/tags', auth, async (req, res) => {
    try {
      const tags = await Note.distinct('tags', { user: req.user });
      res.json(tags);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  /**
 * @route GET /api/notes/search
 * @desc Search notes by query (title, content, tags, folder)
 * @access Private
 * @query q: search string
 * @query folder: filter by folder
 * @query tag: filter by tag
 */
router.get('/search', auth, async (req, res) => {
    try {
      const { q, folder, tag } = req.query;
      const query = { user: req.user };
  
      if (q) {
        query.$or = [
          { title: { $regex: q, $options: 'i' } },
          { content: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } },
          { folder: { $regex: q, $options: 'i' } }
        ];
      }
      if (folder) query.folder = folder;
      if (tag) query.tags = tag;
  
      const notes = await Note.find(query).sort({ updatedAt: -1 });
      res.json(notes);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

/**
 * @route GET /api/notes/:id
 * @desc Get a single note by its ID for the logged-in user
 * @access Private
 */
router.get('/:id', auth, async (req, res) => {
    try {
      const note = await Note.findOne({ _id: req.params.id, user: req.user });
      if (!note) return res.status(404).json({ message: 'Note not found' });
      res.json(note);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  /**
   * @route PUT /api/notes/:id
   * @desc Update a note by its ID for the logged-in user
   * @access Private
   */
  router.put('/:id', auth, async (req, res) => {
    try {
      const { title, content, folder, tags, type, drawingData } = req.body;
      const updateData = { title, content, folder, tags };
      
      // Only update type and drawingData if provided
      if (type !== undefined) updateData.type = type;
      if (drawingData !== undefined) updateData.drawingData = drawingData;
      
      const note = await Note.findOneAndUpdate(
        { _id: req.params.id, user: req.user },
        updateData,
        { new: true }
      );
      if (!note) return res.status(404).json({ message: 'Note not found' });
      res.json(note);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
  /**
   * @route DELETE /api/notes/:id
   * @desc Delete a note by its ID for the logged-in user
   * @access Private
   */
  router.delete('/:id', auth, async (req, res) => {
    try {
      const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user });
      if (!note) return res.status(404).json({ message: 'Note not found' });
      res.json({ message: 'Note deleted' });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

module.exports = router;