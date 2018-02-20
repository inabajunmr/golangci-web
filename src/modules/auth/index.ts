import { combineReducers } from 'redux';
import { put, takeEvery, call, select, fork } from 'redux-saga/effects';
import { IAppStore } from '../../reducers';
import {
  makeApiGetRequest, makeApiPostRequest, makeApiPutRequest,
  IApiResponse, getApiHttpCode, processError
} from '../api';


enum AuthAction {
  Check = "@@GOLANGCI/AUTH/CHECK",
  Checked = "@@GOLANGCI/AUTH/CHECKED",
}

export const checkAuth = () => ({
  type: AuthAction.Check,
});

export const onCheckedAuth = (currentUser: IUser) => ({
  type: AuthAction.Checked,
  currentUser,
});

export interface IAuthStore {
  currentUser?: IUser;
  cookie?: string;
};

export interface IUser {
  id: number;
  name: string;
  avatarUrl: string;
}

const currentUser = (state: IUser = null, action: any): IUser => {
  switch (action.type) {
    case AuthAction.Checked:
      return action.currentUser;
    default:
      return state;
  }
}

const cookie = (state: string = null, action: any): string => {
    return state;
}

export const reducer = combineReducers<IAuthStore>({
  currentUser,
  cookie,
})

function* doAuthCheckRequest() {
  const state: IAppStore = yield select();
  const resp = yield call(makeApiGetRequest, "/v1/auth/check", state.auth.cookie);
  if (!resp || resp.error) {
    if (getApiHttpCode(resp) === 403) {
      // user isn't authorized
      yield put(onCheckedAuth(null))
    } else {
      yield* processError(resp, "Can't check authorization");
    }
  } else {
    yield put(onCheckedAuth(resp.data.user));
  }
}

function* checkAuthWatcher() {
  yield takeEvery(AuthAction.Check, doAuthCheckRequest);
}

export function getWatchers() {
  return [
    fork(checkAuthWatcher),
  ]
}