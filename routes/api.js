/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

// var expect = require('chai').expect;
const Thread = require('../models/thread')
const Reply = require('../models/reply')

//------- THREADS ---------
async function createNewThread(data) {
  const { board, text, delete_password } = data
  try {
    const newThread = new Thread({ board, text, delete_password })
    return await newThread.save()
  } catch (e) {
    console.log(e)
  }
}

async function reportThread(data) {
  const { id, board } = data
  try {    
    const thread = await Thread.findById(id)
    // let thread = await Thread.find({ _id: id, board })
    // thread = thread[0]
    if(thread) {
      thread.reported = true  
      return await thread.save()
    } else {
      return null
    }
  } catch (e) {
    console.log(e)
  }
}

async function deleteThread(data) {
  const { id, board, delete_password } = data
  try {    
    const thread = await Thread.findById(id)
    // console.log(thread)
    if(thread) {
      // console.log('Passwords:', delete_password, thread.delete_password)
      if(thread.delete_password === delete_password) {
        return await Thread.deleteOne({ _id: id })
      } else {
        return null
      }
    } else {
      return null
    }
  } catch (e) {
    console.log(e)
  }
}

async function getRecentThreads(board) {
  try {
    const threads = await Thread
      .find({ board })
      .sort({ bumped_on: 'desc' })
      .limit(10)
      .select('board text')
      .populate({
        path: 'replies',
        select: 'text',
        options: {sort: { 'updatedAt': -1 }, limit: 3}
      })
    return threads
  } catch (e) {
    console.log(e)
  }
}

//------- REPLIES ---------
async function createNewReply(data) {
  const { text, delete_password, thread_id } = data
  try {
    const thread = await Thread.findById(thread_id)
    if(thread) {
      const newReply = new Reply({ text, delete_password, thread: thread_id })
      const reply = await newReply.save()
      thread.replies = [...thread.replies, reply.id]
      await thread.save()
      return reply
    } else {
      return null
    }
  } catch (e) {
    console.log(e)
  }
}

async function getAllReplies(thread_id) {
  try {
    const replies = await Reply.find({ thread: thread_id }).select('text')
    if(replies) {
      return replies
    } else {
      return null
    }
  } catch (e) {
    console.log(e)
  }
}

async function deleteReply(data) {
  const { thread_id, reply_id, delete_password } = data
  try {    
    const reply = await Reply.findById(reply_id)
    // console.log(reply)
    if(reply) {
      // console.log('Passwords:', delete_password, reply.delete_password)
      if(reply.delete_password === delete_password) {
        reply.text = '[deleted]'
        return await reply.save()
      } else {
        return null
      }
    } else {
      return null
    }
  } catch (e) {
    console.log(e)
  }
}

async function reportReply(data) {
  const { thread_id, reply_id } = data // thread not used!
  try {    
    const reply = await Reply.findById(reply_id)
    if(reply) {
      reply.reported = true
      return await reply.save()
    } else {
      return null
    }
  } catch (e) {
    console.log(e)
  }
}


//-------------------------------------
module.exports = function (app) {
  
  app.route('/api/threads/:board')
    .get((req, res) => {
      const { board } = req.params
      getRecentThreads(board)
      .then(threads => res.json(threads))
    })
  
    .post((req, res) => {
      const { board } = req.params
      const { text, delete_password } = req.body
      createNewThread({ board, text, delete_password })
      .then(thread => {
        // console.log('New thread created:', thread)
        res.redirect(`/b/${board}`)        
      })
    })
  
    .put((req, res) => {
      const { board, thread_id } = req.body
      reportThread({ id: thread_id, board })
      .then(thread => {
        if(thread) {
          // console.log('Thread reported:', thread)
          res.send('success')
        } else {
          res.send('failed')
        }
      })
    })
  
    .delete((req, res) => {
      const { board, thread_id, delete_password } = req.body
      deleteThread({ id: thread_id, delete_password })
      .then(thread => {
        if(thread) {
          // console.log('Thread deleted:', thread)
          res.send('success')
        } else {
          res.send('incorrect password')
        }
      })
    })
    
  app.route('/api/replies/:board')
    .get((req, res) => {
    // /api/replies/{board}?thread_id={thread_id}
      const { thread_id } = req.query
      getAllReplies(thread_id)
      .then(replies => res.json(replies))
    })
  
    .post((req, res, next) => {
      const { board } = req.params  
      const { thread_id, text, delete_password } = req.body
      createNewReply({ thread_id, text, delete_password })
      .then(reply => {
        if(reply) {
          res.redirect(`/b/${board}/${thread_id}`)
        } else {
          next()
        }
      })
    })
  
    .put((req, res) => {
      const { reply_id, thread_id } = req.body
      reportReply({ thread_id, reply_id })
      .then(reply => {
        if(reply) {
          // console.log('Reply reported:', reply)
          res.send('success')
        } else {
          res.send('failed')
        }
      })
    })
  
    .delete((req, res) => {
      const { thread_id, reply_id, delete_password } = req.body
      deleteReply({ thread_id, reply_id, delete_password })
      .then(reply => {
        if(reply) {
          res.send('success')
        } else {
          res.send('incorrect password')
        }
      })
    })

};
