'use strict'

let chai = require('chai');
let assert = chai.assert;
let sinon = require('sinon');

describe('db', function() {
	let factory,
			config,
			sandbox;
	
	function local(lib) {
		return '../../../lib/' + lib;
	}

	function getRequires() {
		config = require(local('config'));
		config.db = 'dbConfig';
		factory = require(local('factory'));
	}
		
	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		getRequires();
	})
		
	afterEach(function() {
		sandbox.restore();
	})
	
  describe('require', function() {
		let db, run, dbFactoryResult;

		function addToRun(func) {
			let prepare = run;
			run = () => {
				var result = prepare();
				return result && result.then ? result.then(func) : func();
			};
		}
		
		beforeEach(function() {
			run = () => {
				delete require.cache[require.resolve(local('db'))];
				return require(local('db'));
			}
			dbFactoryResult = {db:'db'};
			factory.knex = sandbox.stub(factory, 'knex');
		})
		
    it('should create a db connection', function() {
			factory.knex
				.withArgs({
						client: 'pg',
						connection: 'dbConfig'
					})
				.returns(dbFactoryResult);
			assert.equal(run(), dbFactoryResult);
    })

		describe('upsert', function() {
			let tableName = 'tableName',
				conflictTarget = 'conflictTarget',
				values = 'values';
		
			beforeEach(function() {
				sandbox.restore();
				config.db = null;
			})
			
			it('converts a string for conflictTarget into an array', function() {
				let db = run();
				let spy = sandbox.spy(db, 'upsert');
				db.upsert(tableName, conflictTarget, values);
				assert(spy.called);
				assert(spy.calledTwice);
				assert(spy.firstCall.calledWithExactly(tableName, conflictTarget, values));
				assert(spy.secondCall.calledWithExactly(tableName, [conflictTarget], values));
			})
		})
  })
})
