let chai = require('chai');
let assert = chai.assert;
let sinon = require('sinon');

describe('db', function() {
	let factory,
			config;
	
	function local(lib) {
		return '../../../lib/' + lib;
	}
	
	function resetRequire(lib) {
		delete require.cache[require.resolve(lib)]
	}

	function getRequires() {
		config = require(local('config'));
		factory = require(local('factory'));
	}
	
	function resetRequires() {
		resetRequire(local('factory'));
		resetRequire(local('config'));
		resetRequire(local('db'));
	}
	
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
			resetRequires();
			getRequires();
			config.db = 'dbConfig';
			run = () => { return db = require(local('db')) }
			dbFactoryResult = {db:'db'};
			factory.knex = sinon.stub().returns(dbFactoryResult);
		})
		
    it('should create a db connection', function() {
			run();
			assert(factory.knex.called);
			assert(factory.knex.called);
			assert(factory.knex.calledWithExactly({
				client: 'pg',
				connection: 'dbConfig'
			}));
    })
  })
})
