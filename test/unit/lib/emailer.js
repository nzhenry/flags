'use strict'

let chai = require('chai');
let assert = chai.assert;
let sinon = require('sinon');

describe('emailer', function() {
	let config,
			nodemailer,
			jwt,
			uuid,
			sandbox;
	
	function local(lib) {
		return '../../../lib/' + lib;
	}

	function getRequires() {
		config = require(local('config'));
		config.db = 'dbConfig';
		nodemailer = require('nodemailer');
		jwt = require('jsonwebtoken');
		uuid = require('node-uuid');
	}
		
	beforeEach(function() {
		sandbox = sinon.sandbox.create();
		getRequires();
	})
		
	afterEach(function() {
		sandbox.restore();
	})
	
  describe('require', function() {
		let db, run;

		function addToRun(func) {
			let prepare = run;
			run = () => {
				var result = prepare();
				return result && result.then ? result.then(func) : func();
			};
		}
		
		beforeEach(function() {
			run = () => {
				delete require.cache[require.resolve(local('emailer'))];
				return require(local('emailer'));
			}
		})
		
    it('should expose "sendResetPasswordLink" function', function() {
			assert.isFunction(run().sendResetPasswordLink);
    })

		describe('sendResetPasswordLink', function() {
			beforeEach(function() {
				nodemailer.createTransport = sandbox.stub(nodemailer, 'createTransport');
				nodemailer.createTransport.withArgs(config.smtpConfig).returns({
					sendMail: sinon.stub().callsArg(1)
				});
			})

			it('should send email', function() {
				return run().sendResetPasswordLink({
					createPasswordResetKey: () => Promise.resolve(),
					id: 'id',
					email: 'email'
				});
			})
		})
  })
})
