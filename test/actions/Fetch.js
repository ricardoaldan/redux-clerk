import { expect } from 'chai'
import sinon from 'sinon'
import { Map } from 'immutable'
import { Fetch } from '../../src/actions/Fetch'

describe('Actions::Fetch', () => {

  let dispatchSpy

  const configBase = {
    actionPrefix: 'test',
    uidField: 'uid'
  }

  const configSuccess = Object.assign({}, configBase, {
    fetcher: (params, success) => {
      success([{ uid: 123, name: 'test' }])
      return Promise.resolve()
    }
  })

  const configError = Object.assign({}, configBase, {
    fetcher: (params, success, error) => {
      error({ error: 'test' })
      return Promise.resolve()
    }
  })

  const configSpy = Object.assign({}, configBase, {
    fetcher: sinon.spy()
  })

  beforeEach(() => {
    dispatchSpy = sinon.spy()
  })

  describe('do', () => {
    it('should return a thunk', () => {
      const action = new Fetch(configBase)
      const actionDo = action.do('users')
      expect(actionDo).to.be.a('function')
    })

    it('should dispatch start action', () => {
      const action = new Fetch(configBase)
      action.do('users', { page: 1 }, { appendResponse: true })(dispatchSpy)
      expect(dispatchSpy.calledTwice).to.be.true
      expect(dispatchSpy.firstCall.calledWith({
        type: 'TEST_FETCH',
        instance: 'users',
        uidField: configBase.uidField,
        options: { appendResponse: true }
      })).to.be.true
      expect(dispatchSpy.secondCall.calledWith({
        type: 'TEST_FETCH_POST',
        instance: 'users',
        uidField: configBase.uidField,
        options: { appendResponse: true }
      })).to.be.true
    })

    it('should call config.fetcher with provided params', () => {
      const action = new Fetch(configSpy)
      const params = { someParam: 'test' }
      action.do('users', params)(dispatchSpy)
      expect(configSpy.fetcher.calledOnce).to.be.true
      expect(configSpy.fetcher.args[0][0]).to.deep.equal(params)
    })

    it('should convert immutable map params to raw js', () => {
      const action = new Fetch(configSpy)
      const params = Map({ someParam: 'test' })
      action.do('users', params)(dispatchSpy)
      expect(configSpy.fetcher.args[0][0]).to.deep.equal(params.toJS())
    })

    it('should dispatch success action', done => {
      const action = new Fetch(configSuccess)
      action.do('users')(dispatchSpy).then(() => {
        expect(dispatchSpy.callCount).to.equal(4)
        expect(dispatchSpy.getCall(2).calledWith({
          type: 'TEST_FETCH_SUCCESS',
          instance: 'users',
          uidField: configBase.uidField,
          responseData: [{ uid: 123, name: 'test' }],
          options: {}
        })).to.be.true
        expect(dispatchSpy.getCall(3).calledWith({
          type: 'TEST_FETCH_SUCCESS_POST',
          instance: 'users',
          uidField: configBase.uidField,
          responseData: [{ uid: 123, name: 'test' }],
          options: {}
        })).to.be.true
        done()
      })
    })

    it('should dispatch error action', done => {
      const action = new Fetch(configError)
      action.do('users')(dispatchSpy).then(() => {
        expect(dispatchSpy.callCount).to.equal(4)
        expect(dispatchSpy.getCall(2).calledWith({
          type: 'TEST_FETCH_ERROR',
          instance: 'users',
          uidField: configBase.uidField,
          responseData: { error: 'test' },
          options: {}
        })).to.be.true
        expect(dispatchSpy.getCall(3).calledWith({
          type: 'TEST_FETCH_ERROR_POST',
          instance: 'users',
          uidField: configBase.uidField,
          responseData: { error: 'test' },
          options: {}
        })).to.be.true
        done()
      })
    })
  })
})
