let chai = require('chai');
let assert = chai.assert;
let sinon = require('sinon');

describe('db', function() {
	let dbFactory,
			config;
	
	function local(lib) {
		return '../../../lib/' + lib;
	}
	
	function resetRequire(lib) {
		delete require.cache[require.resolve(lib)]
	}

	function getRequires() {
		config = require(local('config'));
		dbFactory = require(local('dbFactory'));
	}
	
	function resetRequires() {
		resetRequire(local('dbFactory'));
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
			dbFactory.get = sinon.stub().returns(dbFactoryResult);
		})
		
    it('should create a db connection', function() {
			run();
			assert(dbFactory.get.called);
			assert(dbFactory.get.called);
			assert(dbFactory.get.calledWithExactly({
				client: 'pg',
				connection: 'dbConfig'
			}));
    })
  })
})
