import * as stores from './stores.js';
import * as config from './config.js';
import {get} from 'svelte/store';
import {base_host} from './stores.js';

const getHeaders = (auth) => {
  const basicHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    //'X-Requested-With': 'XMLHttpRequest',
  };

  const authHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    //'X-Requested-With': 'XMLHttpRequest',
    'Authorization': 'Bearer ' + get(stores.access_token).toString(),
    'X-CSRF-Token': get(stores.csrf_token).toString(),
  };

  if (auth === 'auth') {
    return authHeaders;
  }
  else {
    return basicHeaders;
  }
}

const proxy = config.proxy;

export const login = async () => {
  const response = await fetch(proxy + config.loginURL, {
    method: 'POST',
    headers: getHeaders(),
    cache: 'no-cache',
    body: JSON.stringify({"name": config.user, "pass": config.password})
  });
  const data = await response.json();
  stores.csrf_token.set(data.csrf_token);
  stores.access_token.set(data.access_token);
  stores.logout_token.set(data.logout_token);
  console.log(data);
  return data;
}

export const logout = async () => {
  const response = await fetch(proxy + config.logoutURL + '&token=' + get(stores.logout_token), {
    method: 'POST',
    headers: getHeaders('auth'),
    body: JSON.stringify({"name": config.user, "pass": config.password})
  });
  const data = await response.json();
  return data;
}

export const getStories = async () => {

  const response = await fetch(proxy + config.getInitStoriesURL, {
    method: 'POST',
    headers: getHeaders('auth'),
    cache: 'no-cache',
    /*body: JSON.stringify({
      "StoryCount": 5,
      "HostEntityType": 'user',
      "HostEntityId": '111'
    })*/
    /* Use svelte serialized store object from ui selection.
     * Real world example would be in a form similar to the code above
     */
    body: get(base_host)
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const selectStories = async (storyline) => {
  const response = await fetch(proxy + config.selectStoriesURL, {
    method: 'POST',
    headers: getHeaders('auth'),
    cache: 'no-cache',
    body: JSON.stringify(storyline)
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const saveStoryline = async () => {
  const response = await fetch(proxy + config.saveStorylineURL, {
    method: 'POST',
    headers: getHeaders('auth'),
    cache: 'no-cache',
    /*body: JSON.stringify({
      "HostEntityType": 'user',
      "HostEntityId": '111'
    })*/
    /* Use svelte serialized store object from ui selection.
     * Real world example would be in a form similar to the code above
     */
    body: get(base_host)
  });
  const data = response.status;
  console.log(data);
  return data;
}

export const getHosts = async (type, host) => {
  let url = config.getHostURL;
  url = url.replace(/\{type\}/,type).replace(/\{id\}/, host);
  const response = await fetch(proxy + url, {
    method: 'GET',
    headers: getHeaders('auth'),
    cache: 'no-cache',
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const getMatching = async (type, host, filteredHosts) => {
  let url = config.getMatchingURL;


  const response = await fetch(proxy + url, {
    method: 'POST',
    headers: getHeaders('auth'),
    cache: 'no-cache',
    body: JSON.stringify({
      "HostEntityType": type,
      "HostEntityId": host,
      "FilteredHosts": filteredHosts
    }),
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const createHost = async (id, type, language) => {
  const response = await fetch(proxy + config.createHostURL, {
    method: 'POST',
    headers: getHeaders('auth'),
    cache: 'no-cache',
    body: JSON.stringify({
      "HostEntityType": type,
      "HostEntityId": id,
      "Language": language
    })
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const deleteHost = async (id, type) => {
  let url = config.deleteHostURL;
  url = url.replace(/\{type\}/,type).replace(/\{id\}/, id);

  const response = await fetch(proxy + url, {
    method: 'DELETE',
    headers: getHeaders('auth'),
    cache: 'no-cache',
  });
  const data = await response;
  console.log(JSON.stringify(data));
  return data;
}

export const syncHosts = async () => {
  const testdata = '';
  const response = await fetch(proxy + config.selectStoriesURL, {
    method: 'POST',
    headers: getHeaders('auth'),
    cache: 'no-cache',
    body: JSON.stringify(testdata)
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const getStoryline = async (type, host) => {
  let url = config.getStorylineURL;
  url = url.replace(/\{type\}/,type).replace(/\{id\}/, host);
  const response = await fetch(proxy + url, {
    method: 'GET',
    headers: getHeaders('auth'),
    cache: 'no-cache'
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const getAllHosts = async () => {
  const response = await fetch(proxy + config.getAllHostsURL, {
    method: 'GET',
    headers: getHeaders('auth'),
    cache: 'no-cache',
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const getReport = async (type, host) => {
  let url = config.getReportURL;
  url = url.replace(/\{type\}/,type).replace(/\{id\}/, host);
  const response = await fetch(proxy + url, {
    method: 'GET',
    headers: getHeaders('auth'),
    cache: 'no-cache',
  });
  const data = await response.json();
  console.log(data);
  return data;
}

export const selectReport = async (type, host) => {
  let url = config.selectReportURL;

  const response = await fetch(proxy + url, {
    method: 'POST',
    headers: getHeaders('auth'),
    cache: 'no-cache',
    body: JSON.stringify({
      "HostEntityType": type,
      "HostEntityId": host
    }),
  });
  const data = await response.json();
  console.log(data);
  return data;
}