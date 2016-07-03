'use strict'

let chai = require('chai');
let assert = chai.assert;
let sinon = require('sinon');

describe('emailer', function() {
	let config,
			db,
			crypto,
			sandbox;
	
	function local(lib) {
		return '../../../../lib/' + lib;
	}

	function getRequires() {
		config = require(local('config'));
		config.db = 'dbConfig';
		db = require(local('db'));
		crypto = require('crypto');
	}
		
	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		getRequires();
	})
		
	afterEach(function() {
		sandbox.restore();
	})
	
  describe('require', function() {
		let run;

		function addToRun(func) {
			let prepare = run;
			run = () => {
				var result = prepare();
				return result && result.then ? result.then(func) : func();
			};
		}
		
		beforeEach(function() {
			run = () => {
				delete require.cache[require.resolve(local('model/users'))];
				return require(local('model/users'));
			};
			db.users = sandbox.stub(db, 'users');
		})
		
    it('should expose a "one" function', function() {
			assert.isFunction(run().one)
    })
		
    it('should expose a "create" function', function() {
			assert.isFunction(run().create)
    })
		
    it('should expose a "update" function', function() {
			assert.isFunction(run().update)
    })

		describe('one', function() {
			beforeEach(function() {

			})

			it('should send email', function() {

			})
		})
  })
})
