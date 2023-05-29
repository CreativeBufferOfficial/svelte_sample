// Paltform API user
export const user = '<user>';
export const password = '<password>';

// API base url
export const baseURL = '';

// Proxy
//export const proxy = '';
export const proxy = '<url>';

// API Endpoints
export const loginURL = baseURL + '/user/login?_format=json';
export const logoutURL = baseURL + '/user/logout?_format=json';
export const getInitStoriesURL = baseURL + '/match/get_stories/?_format=json';
export const selectStoriesURL = baseURL + '/match/select_stories/?_format=json';
export const getStorylineURL = baseURL + '/match/storyline/{type}/{id}/?_format=json';
export const saveStorylineURL = baseURL + '/match/save_storyline/?_format=json';
export const getMatchingURL = baseURL + '/match/get_matching/?_format=json';
export const getHostURL = baseURL + '/match/storylinehost/{type}/{id}?_format=json';
export const createHostURL = baseURL + '/match/storylinehost?_format=json';
export const deleteHostURL = baseURL + '/match/storylinehost/{type}/{id}/?_format=json';
export const syncHostURL = baseURL + '/match/sync_hosts?_format=json';
export const getAllHostsURL = baseURL + '/match/get_all_hosts?_format=json';
export const getReportURL = baseURL + '/match/report/{type}/{id}?_format=json';
export const selectReportURL = baseURL + '/match/select_report/?_format=json';
