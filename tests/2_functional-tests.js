/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
const Thread = require('../models/thread')
const Reply = require('../models/reply')

chai.use(chaiHttp);

suite('Functional Tests', function() {

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    suite('POST', function() {
      test('a new thread', (done) => {
        chai.request(server)
        .post('/api/threads/test')
        .send({ text: 'test_text', delete_password: 'password' })
        .end(async function(err, res){
          const thread = await Thread.findOne({ text: 'test_text' })
          assert.equal(res.status, 200)
          assert.equal(thread.board, 'test')
          assert.equal(thread.text, 'test_text')
          assert.equal(thread.reported, false)
          assert.equal(thread.delete_password, 'password')
          assert.isArray(thread.replies)
          assert.property(thread, 'created_on')
          assert.property(thread, 'bumped_on')
          await Thread.deleteMany({ board: 'test' }) // DB cleanup
          done();
        })
      })
    });
    
    suite('GET', function() {
      test('all threads', (done) => {
        const thread1 = new Thread({ board: 'test', text: 'text1', delete_password: 'password' })
        const thread2 = new Thread({ board: 'test', text: 'text2', delete_password: 'password' })
        const thread3 = new Thread({ board: 'test', text: 'text3', delete_password: 'password' })
        thread1.save()
        .then(thread2.save()
        .then(thread3.save()
        .then(
          chai.request(server)
          .get('/api/threads/test')
          .end(function(err, res){
            assert.equal(res.status, 200)
            assert.isArray(res.body)
            assert.isObject(res.body[0])
            assert.equal(res.body.length, 3)
            // assert.equal(res.body[0].board, 'test')
            Thread.deleteMany({ board: 'test' }).then(r=>{}) // DB cleanup
            done();
          })
        )))
      })
    });
    
    suite('DELETE', function() {
      test('thread with correct password', (done) => {
        const thread = new Thread({ board: 'test', text: 'text', delete_password: 'correct_password' })
        thread.save()
        .then(
          chai.request(server)
          .delete('/api/threads/test')
          .send({ thread_id: thread.id, delete_password: 'correct_password' })
          .end(function(err, res){
            assert.equal(res.status, 200)
            assert.equal(res.text, 'success')
            done();
          })
        )
      })
      
      test('thread with incorrect password', (done) => {
        const thread = new Thread({ board: 'test', text: 'text', delete_password: 'password' })
        thread.save()
        .then(
          chai.request(server)
          .delete('/api/threads/test')
          .send({ thread_id: thread.id, delete_password: 'incorrect_password' })
          .end(function(err, res){
            assert.equal(res.status, 200)
            assert.equal(res.text, 'incorrect password')
            Thread.deleteOne({ board: 'test' }).then(r=>{}) // DB cleanup
            done();
          })
        )
      })
      
    });
    
    suite('PUT', function() {
      test('to report thread', (done) => {
        const thread = new Thread({ board: 'test', text: 'text', delete_password: 'password' })
        thread.save()
        .then(
          chai.request(server)
          .put('/api/threads/test')
          .send({ thread_id: thread.id })
          .end(function(err, res){
            assert.equal(res.status, 200)
            assert.equal(res.text, 'success')
            Thread.findOne({ board: 'test' })
            .then(thread => {
              assert.equal(thread.reported, true)
              Thread.deleteOne({ board: 'test' }).then(r=>{}) // DB cleanup
              done();
            })
            .catch(e => console.log(e))
          })
        )
      })
    });
    

  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    suite('POST', function() {
      test('a new reply', (done) => {
        const thread = new Thread({ board: 'test', text: 'text', delete_password: 'password' })
        thread.save()
        .then(thread => {
          const thread_id = thread.id
          chai.request(server)
          .post('/api/replies/test')
          .send({ text: 'test_text', delete_password: 'password', thread_id })
          .end(async function(err, res){
            const reply = await Reply.findOne({ thread: thread_id })
            assert.equal(res.status, 200)
            assert.equal(reply.text, 'test_text')
            assert.equal(reply.reported, false)
            assert.equal(reply.delete_password, 'password')
            assert.equal(reply.thread, thread_id)
            await Reply.deleteMany({ thread: thread_id }) // DB cleanup
            await Thread.deleteMany({ board: 'test' }) // DB cleanup
            done();
          })    
        })  
      })
    });
    
    suite('GET', function() {
      test('all replies', (done) => {
        const thread = new Thread({ board: 'test', text: 'text', delete_password: 'password' })
        thread.save()
        .then(thread => {
          const thread_id = thread.id
          const reply1 = new Reply({ text: 'text1', delete_password: 'password', thread: thread_id })
          const reply2 = new Reply({ text: 'text2', delete_password: 'password', thread: thread_id })
          const reply3 = new Reply({ text: 'text3', delete_password: 'password', thread: thread_id })
          reply1.save()
          .then(reply1 => {
            reply2.save()
            .then(reply2 => {
              reply3.save()
              .then(reply3 => {
                thread.replies = [...thread.replies, reply1.id, reply2.id, reply3.id]
                thread.save()
                .then(thread => {
                  chai.request(server)
                  .get('/api/replies/test?thread_id='+ thread.id) // /api/replies/{board}?thread_id={thread_id}
                  .end(function(err, res){
                    assert.equal(res.status, 200)
                    assert.isArray(res.body)
                    assert.isObject(res.body[0])
                    assert.equal(res.body.length, 3)
                    Reply.deleteMany({ thread: thread_id }).then(r=>{}) // DB cleanup
                    Thread.deleteMany({ board: 'test' }).then(r=>{}) // DB cleanup
                    done();
                  })
                })
              })
            })
          })
        })       
      })
    });
    
    suite('PUT', function() {
      test('to report reply', (done) => {
        const thread = new Thread({ board: 'test', text: 'text', delete_password: 'password' })
        thread.save()
        .then(thread => {
          const thread_id = thread.id
          const reply = new Reply({ text: 'text', delete_password: 'password', thread: thread_id })
          reply.save()
          .then(reply => {
            const reply_id = reply.id
            chai.request(server)
            .put('/api/replies/test')
            .send({ reply_id, thread_id })
            .end(async function(err, res){
              assert.equal(res.status, 200)
              assert.equal(res.text, 'success')
              Reply.findById(reply_id)
              .then(replyReported => {
                assert.equal(replyReported.reported, true)
                Thread.findByIdAndDelete(thread_id).then(r=>{}) // DB cleanup
                Reply.findByIdAndDelete(reply_id).then(r=>{}) // DB cleanup
                done();
              })
              .catch(e => console.log(e))
            })
          })
        })              
      })  
    });
    
    suite('DELETE', function() {
      test('reply with correct password', (done) => {
        const thread = new Thread({ board: 'test', text: 'text', delete_password: 'password' })
        thread.save()
        .then(thread => {
          const thread_id = thread.id
          const reply = new Reply({ text: 'text', delete_password: 'correct_password', thread: thread_id })
          reply.save()
          .then(reply => {
            const reply_id = reply.id
            chai.request(server)
            .delete('/api/replies/test')
            .send({ reply_id, thread_id, delete_password: 'correct_password' })
            .end(async function(err, res){
              assert.equal(res.status, 200)
              assert.equal(res.text, 'success')
              Reply.findById(reply_id)
              .then(replyDeleted => {
                assert.equal(replyDeleted.text, '[deleted]') // change!!
                Thread.findByIdAndDelete(thread_id).then(r=>{}) // DB cleanup
                Reply.findByIdAndDelete(reply_id).then(r=>{}) // DB cleanup
                done();
              })
              .catch(e => console.log(e))
            })
          })
        })              
      })
      
      test('reply with incorrect password', (done) => {
        const thread = new Thread({ board: 'test', text: 'text', delete_password: 'password' })
        thread.save()
        .then(thread => {
          const thread_id = thread.id
          const reply = new Reply({ text: 'text', delete_password: 'password', thread: thread_id })
          reply.save()
          .then(reply => {
            const reply_id = reply.id
            chai.request(server)
            .delete('/api/replies/test')
            .send({ reply_id, thread_id, delete_password: 'incorrect_password' })
            .end(async function(err, res){
              assert.equal(res.status, 200)
              assert.equal(res.text, 'incorrect password')
              Thread.findByIdAndDelete(thread_id).then(r=>{}) // DB cleanup
              Reply.findByIdAndDelete(reply_id).then(r=>{}) // DB cleanup
              done();
            })
          })
        })              
      })
      
    });
    
  });

});
