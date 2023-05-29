
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function get_binding_group_value(group, __value, checked) {
        const value = new Set();
        for (let i = 0; i < group.length; i += 1) {
            if (group[i].checked)
                value.add(group[i].__value);
        }
        if (!checked) {
            value.delete(__value);
        }
        return Array.from(value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }
    class HtmlTag {
        constructor() {
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.2' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const csrf_token = writable('');
    const access_token = writable('');
    const logout_token = writable('');
    const host_entity = writable('');
    const storyline = writable('');
    const base_host = writable('');

    var stores = /*#__PURE__*/Object.freeze({
        __proto__: null,
        csrf_token: csrf_token,
        access_token: access_token,
        logout_token: logout_token,
        host_entity: host_entity,
        storyline: storyline,
        base_host: base_host
    });

    // Paltform API user
    const user = 'innerworks_test';
    const password = 'bk#i5D43mb8Dhha3';

    // API base url
    const baseURL = '';

    // Proxy
    //export const proxy = '';
    const proxy$1 = 'https://consciousmission.com:4455';

    // API Endpoints
    const loginURL = baseURL + '/user/login?_format=json';
    const logoutURL = baseURL + '/user/logout?_format=json';
    const getInitStoriesURL = baseURL + '/match/get_stories/?_format=json';
    const selectStoriesURL = baseURL + '/match/select_stories/?_format=json';
    const getStorylineURL = baseURL + '/match/storyline/{type}/{id}/?_format=json';
    const saveStorylineURL = baseURL + '/match/save_storyline/?_format=json';
    const getMatchingURL = baseURL + '/match/get_matching/?_format=json';
    const getHostURL = baseURL + '/match/storylinehost/{type}/{id}?_format=json';
    const createHostURL = baseURL + '/match/storylinehost?_format=json';
    const deleteHostURL = baseURL + '/match/storylinehost/{type}/{id}/?_format=json';
    const getAllHostsURL = baseURL + '/match/get_all_hosts?_format=json';
    const getReportURL = baseURL + '/match/report/{type}/{id}?_format=json';
    const selectReportURL = baseURL + '/match/select_report/?_format=json';

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
        'Authorization': 'Bearer ' + get_store_value(access_token).toString(),
        'X-CSRF-Token': get_store_value(csrf_token).toString(),
      };

      if (auth === 'auth') {
        return authHeaders;
      }
      else {
        return basicHeaders;
      }
    };

    const proxy = proxy$1;

    const login = async () => {
      const response = await fetch(proxy + loginURL, {
        method: 'POST',
        headers: getHeaders(),
        cache: 'no-cache',
        body: JSON.stringify({"name": user, "pass": password})
      });
      const data = await response.json();
      csrf_token.set(data.csrf_token);
      access_token.set(data.access_token);
      logout_token.set(data.logout_token);
      console.log(data);
      return data;
    };

    const logout = async () => {
      const response = await fetch(proxy + logoutURL + '&token=' + get_store_value(logout_token), {
        method: 'POST',
        headers: getHeaders('auth'),
        body: JSON.stringify({"name": user, "pass": password})
      });
      const data = await response.json();
      return data;
    };

    const getStories = async () => {

      const response = await fetch(proxy + getInitStoriesURL, {
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
        body: get_store_value(base_host)
      });
      const data = await response.json();
      console.log(data);
      return data;
    };

    const selectStories = async (storyline) => {
      const response = await fetch(proxy + selectStoriesURL, {
        method: 'POST',
        headers: getHeaders('auth'),
        cache: 'no-cache',
        body: JSON.stringify(storyline)
      });
      const data = await response.json();
      console.log(data);
      return data;
    };

    const saveStoryline = async () => {
      const response = await fetch(proxy + saveStorylineURL, {
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
        body: get_store_value(base_host)
      });
      const data = response.status;
      console.log(data);
      return data;
    };

    const getHosts = async (type, host) => {
      let url = getHostURL;
      url = url.replace(/\{type\}/,type).replace(/\{id\}/, host);
      const response = await fetch(proxy + url, {
        method: 'GET',
        headers: getHeaders('auth'),
        cache: 'no-cache',
      });
      const data = await response.json();
      console.log(data);
      return data;
    };

    const getMatching = async (type, host, filteredHosts) => {
      let url = getMatchingURL;


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
    };

    const createHost = async (id, type, language) => {
      const response = await fetch(proxy + createHostURL, {
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
    };

    const deleteHost = async (id, type) => {
      let url = deleteHostURL;
      url = url.replace(/\{type\}/,type).replace(/\{id\}/, id);

      const response = await fetch(proxy + url, {
        method: 'DELETE',
        headers: getHeaders('auth'),
        cache: 'no-cache',
      });
      const data = await response;
      console.log(JSON.stringify(data));
      return data;
    };

    const syncHosts = async () => {
      const testdata = '';
      const response = await fetch(proxy + selectStoriesURL, {
        method: 'POST',
        headers: getHeaders('auth'),
        cache: 'no-cache',
        body: JSON.stringify(testdata)
      });
      const data = await response.json();
      console.log(data);
      return data;
    };

    const getStoryline = async (type, host) => {
      let url = getStorylineURL;
      url = url.replace(/\{type\}/,type).replace(/\{id\}/, host);
      const response = await fetch(proxy + url, {
        method: 'GET',
        headers: getHeaders('auth'),
        cache: 'no-cache'
      });
      const data = await response.json();
      console.log(data);
      return data;
    };

    const getAllHosts = async () => {
      const response = await fetch(proxy + getAllHostsURL, {
        method: 'GET',
        headers: getHeaders('auth'),
        cache: 'no-cache',
      });
      const data = await response.json();
      console.log(data);
      return data;
    };

    const getReport = async (type, host) => {
      let url = getReportURL;
      url = url.replace(/\{type\}/,type).replace(/\{id\}/, host);
      const response = await fetch(proxy + url, {
        method: 'GET',
        headers: getHeaders('auth'),
        cache: 'no-cache',
      });
      const data = await response.json();
      console.log(data);
      return data;
    };

    const selectReport = async (type, host) => {
      let url = selectReportURL;

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
    };

    var lib = /*#__PURE__*/Object.freeze({
        __proto__: null,
        login: login,
        logout: logout,
        getStories: getStories,
        selectStories: selectStories,
        saveStoryline: saveStoryline,
        getHosts: getHosts,
        getMatching: getMatching,
        createHost: createHost,
        deleteHost: deleteHost,
        syncHosts: syncHosts,
        getStoryline: getStoryline,
        getAllHosts: getAllHosts,
        getReport: getReport,
        selectReport: selectReport
    });

    /* src\components\Story.svelte generated by Svelte v3.46.2 */

    const { console: console_1$3 } = globals;
    const file$9 = "src\\components\\Story.svelte";

    function create_fragment$9(ctx) {
    	let h3;
    	let t0_value = /*story*/ ctx[0].Title + "";
    	let t0;
    	let t1;
    	let div0;
    	let h50;
    	let t3;
    	let html_tag;
    	let t4;
    	let div1;
    	let h51;
    	let t6;
    	let html_tag_1;
    	let raw1_value = /*story*/ ctx[0].Text + "";

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = "Summary:";
    			t3 = space();
    			html_tag = new HtmlTag();
    			t4 = space();
    			div1 = element("div");
    			h51 = element("h5");
    			h51.textContent = "Text:";
    			t6 = space();
    			html_tag_1 = new HtmlTag();
    			add_location(h3, file$9, 7, 0, 192);
    			add_location(h50, file$9, 9, 4, 225);
    			html_tag.a = null;
    			add_location(div0, file$9, 8, 0, 215);
    			add_location(h51, file$9, 13, 4, 280);
    			html_tag_1.a = null;
    			add_location(div1, file$9, 12, 0, 270);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h50);
    			append_dev(div0, t3);
    			html_tag.m(/*summary*/ ctx[1], div0);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h51);
    			append_dev(div1, t6);
    			html_tag_1.m(raw1_value, div1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*story*/ 1 && t0_value !== (t0_value = /*story*/ ctx[0].Title + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*story*/ 1 && raw1_value !== (raw1_value = /*story*/ ctx[0].Text + "")) html_tag_1.p(raw1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Story', slots, []);
    	let { story } = $$props;
    	console.log(story);

    	let summary = story.Summary != ''
    	? story.Summary
    	: story.Text.replace(/(<([^>]+)>)/gi, "").substring(0, 200) + '[...]';

    	const writable_props = ['story'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Story> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('story' in $$props) $$invalidate(0, story = $$props.story);
    	};

    	$$self.$capture_state = () => ({ story, summary });

    	$$self.$inject_state = $$props => {
    		if ('story' in $$props) $$invalidate(0, story = $$props.story);
    		if ('summary' in $$props) $$invalidate(1, summary = $$props.summary);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [story, summary];
    }

    class Story extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { story: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Story",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*story*/ ctx[0] === undefined && !('story' in props)) {
    			console_1$3.warn("<Story> was created without expected prop 'story'");
    		}
    	}

    	get story() {
    		throw new Error("<Story>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set story(value) {
    		throw new Error("<Story>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\GetStories.svelte generated by Svelte v3.46.2 */
    const file$8 = "src\\components\\GetStories.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (42:0) {:else}
    function create_else_block$1(ctx) {
    	let h3;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Choose stories to calculate your matching index.";
    			add_location(h3, file$8, 42, 4, 1264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(42:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (38:0) {#if initial}
    function create_if_block_2$1(ctx) {
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Begin storyline selection.";
    			t1 = space();
    			p = element("p");
    			p.textContent = "This step have to be performed before matching but can be repeated from time to time to keep your matching index in sync with your personal development.";
    			t3 = space();
    			button = element("button");
    			button.textContent = "Get Stories";
    			add_location(h3, file$8, 38, 4, 993);
    			add_location(p, file$8, 39, 4, 1033);
    			add_location(button, file$8, 40, 4, 1197);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*getInitStories*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(38:0) {#if initial}",
    		ctx
    	});

    	return block;
    }

    // (55:56) 
    function create_if_block_1$1(ctx) {
    	let h4;
    	let t1;
    	let p0;
    	let t3;
    	let p1;
    	let t4;
    	let br;
    	let t5;
    	let t6;
    	let button;
    	let t7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Thank you for your selection.";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Your index is calculated and you can set this selection active by clicking the button.";
    			t3 = space();
    			p1 = element("p");
    			t4 = text("This function is usefull as draft / publish option or a possibility to pause and resume your selection.");
    			br = element("br");
    			t5 = text("\n    The logic for resume would be to check for an existing and not completed storyline for this host entity and call the selection again with this object.");
    			t6 = space();
    			button = element("button");
    			t7 = text("Accept Selection");
    			add_location(h4, file$8, 55, 4, 1644);
    			add_location(p0, file$8, 56, 4, 1687);
    			add_location(br, file$8, 57, 110, 1891);
    			add_location(p1, file$8, 57, 4, 1785);
    			button.disabled = /*disabled*/ ctx[3];
    			add_location(button, file$8, 59, 4, 2059);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t4);
    			append_dev(p1, br);
    			append_dev(p1, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t7);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*saveStorySelection*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*disabled*/ 8) {
    				prop_dev(button, "disabled", /*disabled*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(55:56) ",
    		ctx
    	});

    	return block;
    }

    // (46:0) {#if stories.length > 0}
    function create_if_block$4(ctx) {
    	let div;
    	let h4;
    	let t1;
    	let ul;
    	let current;
    	let each_value = /*stories*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h4 = element("h4");
    			h4.textContent = "Please select a story that appeals to you by clicking on the text.";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h4, file$8, 47, 4, 1364);
    			add_location(div, file$8, 46, 0, 1354);
    			attr_dev(ul, "class", "svelte-16wgjky");
    			add_location(ul, file$8, 49, 0, 1447);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h4);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*postStorySelection, stories*/ 34) {
    				each_value = /*stories*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(46:0) {#if stories.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (51:4) {#each stories as story}
    function create_each_block$3(ctx) {
    	let li;
    	let story;
    	let current;
    	let mounted;
    	let dispose;

    	story = new Story({
    			props: { story: /*story*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(story.$$.fragment);
    			attr_dev(li, "class", "svelte-16wgjky");
    			add_location(li, file$8, 51, 8, 1489);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(story, li, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					li,
    					"click",
    					function () {
    						if (is_function(/*postStorySelection*/ ctx[5](/*story*/ ctx[7]))) /*postStorySelection*/ ctx[5](/*story*/ ctx[7]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const story_changes = {};
    			if (dirty & /*stories*/ 2) story_changes.story = /*story*/ ctx[7];
    			story.$set(story_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(story.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(story.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(story);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(51:4) {#each stories as story}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let t;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*initial*/ ctx[2]) return create_if_block_2$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	const if_block_creators = [create_if_block$4, create_if_block_1$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*stories*/ ctx[1].length > 0) return 0;
    		if (!/*initial*/ ctx[2] && /*storyline*/ ctx[0].CompletedMarker == true) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				} else {
    					if_block1 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_block0.d(detaching);
    			if (detaching) detach_dev(t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GetStories', slots, []);
    	let storyline;
    	let stories = [];
    	let initial = true;
    	let disabled = '';

    	const getInitStories = async () => {
    		let response = await getStories();

    		if (response) {
    			$$invalidate(0, storyline = response.Storyline);
    			$$invalidate(1, stories = response.Stories);
    			$$invalidate(2, initial = false);
    		}
    	};

    	const postStorySelection = async story => {
    		storyline.Stories.push(story);
    		let response = await selectStories(storyline);

    		if (response) {
    			$$invalidate(0, storyline = response.Storyline);
    			$$invalidate(1, stories = response.Stories);
    		}
    	};

    	const saveStorySelection = async () => {
    		let response = await saveStoryline();

    		if (response) {
    			$$invalidate(3, disabled = 'disabled="disabled"');
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GetStories> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getStories,
    		selectStories,
    		saveStoryline,
    		Story,
    		storyline,
    		stories,
    		initial,
    		disabled,
    		getInitStories,
    		postStorySelection,
    		saveStorySelection
    	});

    	$$self.$inject_state = $$props => {
    		if ('storyline' in $$props) $$invalidate(0, storyline = $$props.storyline);
    		if ('stories' in $$props) $$invalidate(1, stories = $$props.stories);
    		if ('initial' in $$props) $$invalidate(2, initial = $$props.initial);
    		if ('disabled' in $$props) $$invalidate(3, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		storyline,
    		stories,
    		initial,
    		disabled,
    		getInitStories,
    		postStorySelection,
    		saveStorySelection
    	];
    }

    class GetStories extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GetStories",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\components\CreateHost.svelte generated by Svelte v3.46.2 */

    const { console: console_1$2 } = globals;
    const file$7 = "src\\components\\CreateHost.svelte";

    function create_fragment$7(ctx) {
    	let h3;
    	let t1;
    	let div;
    	let p;
    	let t2;
    	let br0;
    	let t3;
    	let br1;
    	let t4;
    	let t5;
    	let fieldset;
    	let label0;
    	let input0;
    	let t7;
    	let label1;
    	let input1;
    	let br2;
    	let t9;
    	let label2;
    	let select;
    	let option0;
    	let option1;
    	let br3;
    	let t13;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Why create a host entity?";
    			t1 = space();
    			div = element("div");
    			p = element("p");
    			t2 = text("This step simulates the information provided to the API if a new host entity at a partner platform is getting ready to use the matching service for the first time.");
    			br0 = element("br");
    			t3 = text("\n        It could be invoked on initial user registration, booking of a paid service or first use of the storyline creation interface.");
    			br1 = element("br");
    			t4 = text("\n        Every entity using the matching service or should be matched against have to create such a host entity.");
    			t5 = space();
    			fieldset = element("fieldset");
    			label0 = element("label");
    			label0.textContent = "Host Id";
    			input0 = element("input");
    			t7 = space();
    			label1 = element("label");
    			label1.textContent = "Host Type";
    			input1 = element("input");
    			br2 = element("br");
    			t9 = space();
    			label2 = element("label");
    			label2.textContent = "Host Language";
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "EN";
    			option1 = element("option");
    			option1.textContent = "DE";
    			br3 = element("br");
    			t13 = space();
    			button = element("button");
    			button.textContent = "Create Host";
    			add_location(h3, file$7, 21, 0, 705);
    			add_location(br0, file$7, 24, 171, 945);
    			add_location(br1, file$7, 25, 133, 1083);
    			add_location(p, file$7, 23, 4, 770);
    			attr_dev(div, "class", "description");
    			add_location(div, file$7, 22, 0, 740);
    			attr_dev(label0, "class", "svelte-it39vb");
    			add_location(label0, file$7, 30, 4, 1231);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "a string as unique id");
    			attr_dev(input0, "class", "svelte-it39vb");
    			add_location(input0, file$7, 30, 26, 1253);
    			attr_dev(label1, "class", "svelte-it39vb");
    			add_location(label1, file$7, 31, 4, 1335);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "'job' or 'user'");
    			attr_dev(input1, "class", "svelte-it39vb");
    			add_location(input1, file$7, 31, 28, 1359);
    			add_location(br2, file$7, 31, 101, 1432);
    			attr_dev(label2, "class", "svelte-it39vb");
    			add_location(label2, file$7, 32, 4, 1441);
    			option0.__value = "en";
    			option0.value = option0.__value;
    			add_location(option0, file$7, 32, 80, 1517);
    			option1.__value = "de";
    			option1.value = option1.__value;
    			add_location(option1, file$7, 32, 110, 1547);
    			attr_dev(select, "type", "text");
    			attr_dev(select, "class", "svelte-it39vb");
    			if (/*hostLanguage*/ ctx[2] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[6].call(select));
    			add_location(select, file$7, 32, 32, 1469);
    			add_location(br3, file$7, 32, 149, 1586);
    			add_location(button, file$7, 33, 4, 1595);
    			attr_dev(fieldset, "class", "svelte-it39vb");
    			add_location(fieldset, file$7, 29, 0, 1216);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(p, br0);
    			append_dev(p, t3);
    			append_dev(p, br1);
    			append_dev(p, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, label0);
    			append_dev(fieldset, input0);
    			set_input_value(input0, /*hostId*/ ctx[0]);
    			append_dev(fieldset, t7);
    			append_dev(fieldset, label1);
    			append_dev(fieldset, input1);
    			set_input_value(input1, /*hostType*/ ctx[1]);
    			append_dev(fieldset, br2);
    			append_dev(fieldset, t9);
    			append_dev(fieldset, label2);
    			append_dev(fieldset, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*hostLanguage*/ ctx[2]);
    			append_dev(fieldset, br3);
    			append_dev(fieldset, t13);
    			append_dev(fieldset, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[5]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[6]),
    					listen_dev(button, "click", /*setHost*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hostId*/ 1 && input0.value !== /*hostId*/ ctx[0]) {
    				set_input_value(input0, /*hostId*/ ctx[0]);
    			}

    			if (dirty & /*hostType*/ 2 && input1.value !== /*hostType*/ ctx[1]) {
    				set_input_value(input1, /*hostType*/ ctx[1]);
    			}

    			if (dirty & /*hostLanguage*/ 4) {
    				select_option(select, /*hostLanguage*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(fieldset);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CreateHost', slots, []);
    	let hostEntity = get_store_value(host_entity);
    	let hostId = hostEntity.hostId ? hostEntity.hostId : '';
    	let hostType = hostEntity.hostType ? hostEntity.hostType : '';
    	let hostLanguage = hostEntity.hostLanguage ? hostEntity.hostLanguage : 'en';

    	const setHost = () => {
    		if (access_token.toString() !== '') {
    			createHost(hostId, hostType, hostLanguage);
    			host_entity.set({ hostId, hostType, hostLanguage });
    		} else {
    			console.log('Login first');
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<CreateHost> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		hostId = this.value;
    		$$invalidate(0, hostId);
    	}

    	function input1_input_handler() {
    		hostType = this.value;
    		$$invalidate(1, hostType);
    	}

    	function select_change_handler() {
    		hostLanguage = select_value(this);
    		$$invalidate(2, hostLanguage);
    	}

    	$$self.$capture_state = () => ({
    		createHost,
    		stores,
    		get: get_store_value,
    		hostEntity,
    		hostId,
    		hostType,
    		hostLanguage,
    		setHost
    	});

    	$$self.$inject_state = $$props => {
    		if ('hostEntity' in $$props) hostEntity = $$props.hostEntity;
    		if ('hostId' in $$props) $$invalidate(0, hostId = $$props.hostId);
    		if ('hostType' in $$props) $$invalidate(1, hostType = $$props.hostType);
    		if ('hostLanguage' in $$props) $$invalidate(2, hostLanguage = $$props.hostLanguage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hostId,
    		hostType,
    		hostLanguage,
    		setHost,
    		input0_input_handler,
    		input1_input_handler,
    		select_change_handler
    	];
    }

    class CreateHost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CreateHost",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\DeleteHost.svelte generated by Svelte v3.46.2 */
    const file$6 = "src\\components\\DeleteHost.svelte";

    function create_fragment$6(ctx) {
    	let h3;
    	let t1;
    	let div;
    	let p;
    	let t2;
    	let br0;
    	let t3;
    	let t4;
    	let fieldset;
    	let label0;
    	let input0;
    	let t6;
    	let label1;
    	let input1;
    	let br1;
    	let t8;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Why delete a host entity?";
    			t1 = space();
    			div = element("div");
    			p = element("p");
    			t2 = text("This step simulates the information provided to the API if a host entity at a partner platform is being deleted or no longer subscribes to the service.");
    			br0 = element("br");
    			t3 = text("\n        every information associated with this entity is deleted on the APIs database.");
    			t4 = space();
    			fieldset = element("fieldset");
    			label0 = element("label");
    			label0.textContent = "Host Id";
    			input0 = element("input");
    			t6 = space();
    			label1 = element("label");
    			label1.textContent = "Host Type";
    			input1 = element("input");
    			br1 = element("br");
    			t8 = space();
    			button = element("button");
    			button.textContent = "Delete Host";
    			add_location(h3, file$6, 16, 0, 486);
    			add_location(br0, file$6, 19, 159, 714);
    			add_location(p, file$6, 18, 4, 551);
    			attr_dev(div, "class", "description");
    			add_location(div, file$6, 17, 0, 521);
    			attr_dev(label0, "class", "svelte-it39vb");
    			add_location(label0, file$6, 24, 4, 837);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "a string as unique id");
    			attr_dev(input0, "class", "svelte-it39vb");
    			add_location(input0, file$6, 24, 26, 859);
    			attr_dev(label1, "class", "svelte-it39vb");
    			add_location(label1, file$6, 25, 4, 941);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "'job' or 'user'");
    			attr_dev(input1, "class", "svelte-it39vb");
    			add_location(input1, file$6, 25, 28, 965);
    			add_location(br1, file$6, 25, 101, 1038);
    			add_location(button, file$6, 26, 4, 1047);
    			attr_dev(fieldset, "class", "svelte-it39vb");
    			add_location(fieldset, file$6, 23, 0, 822);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t2);
    			append_dev(p, br0);
    			append_dev(p, t3);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, label0);
    			append_dev(fieldset, input0);
    			set_input_value(input0, /*hostId*/ ctx[0]);
    			append_dev(fieldset, t6);
    			append_dev(fieldset, label1);
    			append_dev(fieldset, input1);
    			set_input_value(input1, /*hostType*/ ctx[1]);
    			append_dev(fieldset, br1);
    			append_dev(fieldset, t8);
    			append_dev(fieldset, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[3]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[4]),
    					listen_dev(button, "click", /*deleteHostCallback*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hostId*/ 1 && input0.value !== /*hostId*/ ctx[0]) {
    				set_input_value(input0, /*hostId*/ ctx[0]);
    			}

    			if (dirty & /*hostType*/ 2 && input1.value !== /*hostType*/ ctx[1]) {
    				set_input_value(input1, /*hostType*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(fieldset);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DeleteHost', slots, []);
    	let hostEntity = get_store_value(host_entity);
    	let hostId = hostEntity.hostId ? hostEntity.hostId : '';
    	let hostType = hostEntity.hostType ? hostEntity.hostType : '';
    	let hostLanguage = hostEntity.hostLanguage ? hostEntity.hostLanguage : '';

    	const deleteHostCallback = () => {
    		deleteHost(hostId, hostType);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DeleteHost> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		hostId = this.value;
    		$$invalidate(0, hostId);
    	}

    	function input1_input_handler() {
    		hostType = this.value;
    		$$invalidate(1, hostType);
    	}

    	$$self.$capture_state = () => ({
    		deleteHost,
    		stores,
    		get: get_store_value,
    		hostEntity,
    		hostId,
    		hostType,
    		hostLanguage,
    		deleteHostCallback
    	});

    	$$self.$inject_state = $$props => {
    		if ('hostEntity' in $$props) hostEntity = $$props.hostEntity;
    		if ('hostId' in $$props) $$invalidate(0, hostId = $$props.hostId);
    		if ('hostType' in $$props) $$invalidate(1, hostType = $$props.hostType);
    		if ('hostLanguage' in $$props) hostLanguage = $$props.hostLanguage;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		hostId,
    		hostType,
    		deleteHostCallback,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class DeleteHost extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DeleteHost",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\GetStoryline.svelte generated by Svelte v3.46.2 */
    const file$5 = "src\\components\\GetStoryline.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (21:0) {#if stories.length > 0 }
    function create_if_block$3(ctx) {
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let fieldset;
    	let ol;
    	let each_value = /*stories*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Current story selection";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Getting the current storyline is useful for end users to check their previous selection if it still fits. This endpoint can also be used as a starting point for pause / resume function in the story selection process.";
    			t3 = space();
    			fieldset = element("fieldset");
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h3, file$5, 21, 0, 666);
    			add_location(p, file$5, 22, 2, 701);
    			add_location(ol, file$5, 26, 4, 954);
    			attr_dev(fieldset, "class", "svelte-y7amv3");
    			add_location(fieldset, file$5, 25, 4, 939);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, ol);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*stories*/ 1) {
    				each_value = /*stories*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ol, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(fieldset);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(21:0) {#if stories.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (28:2) {#each stories as story}
    function create_each_block$2(ctx) {
    	let li;
    	let t_value = /*story*/ ctx[2].Title + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			add_location(li, file$5, 28, 6, 992);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*stories*/ 1 && t_value !== (t_value = /*story*/ ctx[2].Title + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(28:2) {#each stories as story}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let button;
    	let t1;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*stories*/ ctx[0].length > 0 && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Get Storyline";
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(button, file$5, 19, 0, 578);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*getCurrentStoryline*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*stories*/ ctx[0].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GetStoryline', slots, []);
    	let stories = [];

    	const getCurrentStoryline = async () => {
    		// Call with example id and type
    		//let response = await getStoryline('user', '111');
    		// Take current host from stored value
    		let currentHost = JSON.parse(get_store_value(base_host));

    		let response = await getStoryline(currentHost.HostEntityType, currentHost.HostEntityId);

    		if (response) {
    			$$invalidate(0, stories = response.Stories);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GetStoryline> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getStoryline,
    		base_host,
    		get: get_store_value,
    		stories,
    		getCurrentStoryline
    	});

    	$$self.$inject_state = $$props => {
    		if ('stories' in $$props) $$invalidate(0, stories = $$props.stories);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [stories, getCurrentStoryline];
    }

    class GetStoryline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GetStoryline",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\Host.svelte generated by Svelte v3.46.2 */

    const { console: console_1$1 } = globals;
    const file$4 = "src\\components\\Host.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let h5;
    	let t0_value = /*host*/ ctx[0].HostEntityType + "";
    	let t0;
    	let t1;
    	let t2_value = /*host*/ ctx[0].HostEntityId + "";
    	let t2;
    	let t3;
    	let p;
    	let t4;
    	let t5_value = /*host*/ ctx[0].Match + "";
    	let t5;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			p = element("p");
    			t4 = text("Matching: ");
    			t5 = text(t5_value);
    			add_location(h5, file$4, 6, 4, 74);
    			add_location(p, file$4, 7, 4, 129);
    			add_location(div, file$4, 5, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h5);
    			append_dev(h5, t0);
    			append_dev(h5, t1);
    			append_dev(h5, t2);
    			append_dev(div, t3);
    			append_dev(div, p);
    			append_dev(p, t4);
    			append_dev(p, t5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*host*/ 1 && t0_value !== (t0_value = /*host*/ ctx[0].HostEntityType + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*host*/ 1 && t2_value !== (t2_value = /*host*/ ctx[0].HostEntityId + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*host*/ 1 && t5_value !== (t5_value = /*host*/ ctx[0].Match + "")) set_data_dev(t5, t5_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Host', slots, []);
    	let { host } = $$props;
    	console.log(host);
    	const writable_props = ['host'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Host> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('host' in $$props) $$invalidate(0, host = $$props.host);
    	};

    	$$self.$capture_state = () => ({ host });

    	$$self.$inject_state = $$props => {
    		if ('host' in $$props) $$invalidate(0, host = $$props.host);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [host];
    }

    class Host extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { host: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Host",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*host*/ ctx[0] === undefined && !('host' in props)) {
    			console_1$1.warn("<Host> was created without expected prop 'host'");
    		}
    	}

    	get host() {
    		throw new Error("<Host>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set host(value) {
    		throw new Error("<Host>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\GetMatching.svelte generated by Svelte v3.46.2 */

    const { console: console_1 } = globals;
    const file$3 = "src\\components\\GetMatching.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (33:0) {#if initial}
    function create_if_block_2(ctx) {
    	let h30;
    	let t1;
    	let p0;
    	let t3;
    	let button0;
    	let t5;
    	let t6;
    	let h31;
    	let t8;
    	let p1;
    	let t10;
    	let button1;
    	let mounted;
    	let dispose;
    	let if_block = /*allHosts*/ ctx[1].length > 0 && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			h30.textContent = "1. Get a filter list.";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "To only match a prefilterd list of options we need to simulate a filter process by selection in the ui.";
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Get all current hosts";
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			h31 = element("h3");
    			h31.textContent = "2. Get Matchings";
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "Annotate the filterd list with matching results";
    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "Get matches";
    			add_location(h30, file$3, 33, 4, 770);
    			add_location(p0, file$3, 34, 4, 805);
    			add_location(button0, file$3, 35, 4, 920);
    			add_location(h31, file$3, 48, 4, 1418);
    			add_location(p1, file$3, 49, 4, 1448);
    			add_location(button1, file$3, 50, 4, 1507);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, button1, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*getFilterHosts*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*getMatchingHosts*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*allHosts*/ ctx[1].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(t6.parentNode, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(button1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(33:0) {#if initial}",
    		ctx
    	});

    	return block;
    }

    // (37:4) {#if (allHosts.length > 0)}
    function create_if_block_3(ctx) {
    	let fieldset;
    	let each_value_1 = /*allHosts*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			fieldset = element("fieldset");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(fieldset, file$3, 37, 4, 1021);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, fieldset, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(fieldset, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*allHosts, JSON, filteredHosts, get, base_host*/ 6) {
    				each_value_1 = /*allHosts*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(fieldset, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(fieldset);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(37:4) {#if (allHosts.length > 0)}",
    		ctx
    	});

    	return block;
    }

    // (40:12) {#if (JSON.stringify(host) != get(base_host)) }
    function create_if_block_4(ctx) {
    	let label;
    	let input;
    	let input_value_value;
    	let t0;
    	let t1_value = /*host*/ ctx[9].HostEntityId + "";
    	let t1;
    	let t2;
    	let t3_value = /*host*/ ctx[9].HostEntityType + "";
    	let t3;
    	let t4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = text("\n                    HostId: ");
    			t1 = text(t1_value);
    			t2 = text(" Type: ");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(input, "type", "checkbox");
    			input.__value = input_value_value = JSON.stringify(/*host*/ ctx[9]);
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[7][0].push(input);
    			add_location(input, file$3, 41, 20, 1170);
    			attr_dev(label, "class", "svelte-mdsmd1");
    			add_location(label, file$3, 40, 16, 1142);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = ~/*filteredHosts*/ ctx[2].indexOf(input.__value);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, t2);
    			append_dev(label, t3);
    			append_dev(label, t4);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[6]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*allHosts*/ 2 && input_value_value !== (input_value_value = JSON.stringify(/*host*/ ctx[9]))) {
    				prop_dev(input, "__value", input_value_value);
    				input.value = input.__value;
    			}

    			if (dirty & /*filteredHosts*/ 4) {
    				input.checked = ~/*filteredHosts*/ ctx[2].indexOf(input.__value);
    			}

    			if (dirty & /*allHosts*/ 2 && t1_value !== (t1_value = /*host*/ ctx[9].HostEntityId + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*allHosts*/ 2 && t3_value !== (t3_value = /*host*/ ctx[9].HostEntityType + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			/*$$binding_groups*/ ctx[7][0].splice(/*$$binding_groups*/ ctx[7][0].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(40:12) {#if (JSON.stringify(host) != get(base_host)) }",
    		ctx
    	});

    	return block;
    }

    // (39:8) {#each allHosts as host }
    function create_each_block_1(ctx) {
    	let show_if = JSON.stringify(/*host*/ ctx[9]) != get_store_value(base_host);
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*allHosts*/ 2) show_if = JSON.stringify(/*host*/ ctx[9]) != get_store_value(base_host);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(39:8) {#each allHosts as host }",
    		ctx
    	});

    	return block;
    }

    // (53:0) {#if matchingHosts }
    function create_if_block$2(ctx) {
    	let h3;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*matchingHosts*/ ctx[3].length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Matches";
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(h3, file$3, 53, 4, 1595);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(53:0) {#if matchingHosts }",
    		ctx
    	});

    	return block;
    }

    // (63:4) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "No matching hosts found.";
    			add_location(p, file$3, 63, 8, 1841);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(63:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (55:4) {#if matchingHosts.length > 0 }
    function create_if_block_1(ctx) {
    	let ul;
    	let current;
    	let each_value = /*matchingHosts*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "svelte-mdsmd1");
    			add_location(ul, file$3, 55, 8, 1656);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*matchingHosts*/ 8) {
    				each_value = /*matchingHosts*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(55:4) {#if matchingHosts.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (57:12) {#each matchingHosts as host }
    function create_each_block$1(ctx) {
    	let li;
    	let host;
    	let t;
    	let current;

    	host = new Host({
    			props: { host: /*host*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			li = element("li");
    			create_component(host.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "svelte-mdsmd1");
    			add_location(li, file$3, 57, 16, 1720);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			mount_component(host, li, null);
    			append_dev(li, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const host_changes = {};
    			if (dirty & /*matchingHosts*/ 8) host_changes.host = /*host*/ ctx[9];
    			host.$set(host_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(host.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(host.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_component(host);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(57:12) {#each matchingHosts as host }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*initial*/ ctx[0] && create_if_block_2(ctx);
    	let if_block1 = /*matchingHosts*/ ctx[3] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*initial*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*matchingHosts*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*matchingHosts*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GetMatching', slots, []);
    	let initial = true;
    	let allHosts = [];
    	let filteredHosts = [];
    	let matchingHosts = [];
    	let baseHost = '';

    	const getFilterHosts = async () => {
    		let response = await getAllHosts();

    		if (response) {
    			$$invalidate(1, allHosts = JSON.parse(response));
    		}
    	};

    	const getMatchingHosts = async () => {
    		baseHost = JSON.parse(get_store_value(base_host));
    		let response = await getMatching(baseHost.HostEntityType, baseHost.HostEntityId, filteredHosts);

    		if (response) {
    			console.log(response);
    			$$invalidate(3, matchingHosts = response);
    			$$invalidate(0, initial = false);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<GetMatching> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input_change_handler() {
    		filteredHosts = get_binding_group_value($$binding_groups[0], this.__value, this.checked);
    		$$invalidate(2, filteredHosts);
    	}

    	$$self.$capture_state = () => ({
    		getAllHosts,
    		getMatching,
    		base_host,
    		Host,
    		get: get_store_value,
    		initial,
    		allHosts,
    		filteredHosts,
    		matchingHosts,
    		baseHost,
    		getFilterHosts,
    		getMatchingHosts
    	});

    	$$self.$inject_state = $$props => {
    		if ('initial' in $$props) $$invalidate(0, initial = $$props.initial);
    		if ('allHosts' in $$props) $$invalidate(1, allHosts = $$props.allHosts);
    		if ('filteredHosts' in $$props) $$invalidate(2, filteredHosts = $$props.filteredHosts);
    		if ('matchingHosts' in $$props) $$invalidate(3, matchingHosts = $$props.matchingHosts);
    		if ('baseHost' in $$props) baseHost = $$props.baseHost;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		initial,
    		allHosts,
    		filteredHosts,
    		matchingHosts,
    		getFilterHosts,
    		getMatchingHosts,
    		input_change_handler,
    		$$binding_groups
    	];
    }

    class GetMatching extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GetMatching",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\HostList.svelte generated by Svelte v3.46.2 */
    const file$2 = "src\\components\\HostList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (24:0) {#if hosts.length > 0}
    function create_if_block$1(ctx) {
    	let select;
    	let option;
    	let mounted;
    	let dispose;
    	let each_value = /*hosts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			select = element("select");
    			option = element("option");
    			option.textContent = "- All -";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			option.__value = "- All -";
    			option.value = option.__value;
    			add_location(option, file$2, 25, 4, 716);
    			add_location(select, file$2, 24, 0, 679);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			append_dev(select, option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(select, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(select, "change", /*setBaseHost*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*JSON, hosts*/ 1) {
    				each_value = /*hosts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(select, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(24:0) {#if hosts.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (27:4) {#each hosts as host}
    function create_each_block(ctx) {
    	let option;
    	let t0;
    	let t1_value = /*host*/ ctx[3].HostEntityId + "";
    	let t1;
    	let t2;
    	let t3_value = /*host*/ ctx[3].HostEntityType + "";
    	let t3;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text("HostId: ");
    			t1 = text(t1_value);
    			t2 = text(" Type: ");
    			t3 = text(t3_value);
    			option.__value = option_value_value = JSON.stringify(/*host*/ ctx[3]);
    			option.value = option.__value;
    			add_location(option, file$2, 27, 8, 775);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    			append_dev(option, t2);
    			append_dev(option, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*hosts*/ 1 && t1_value !== (t1_value = /*host*/ ctx[3].HostEntityId + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*hosts*/ 1 && t3_value !== (t3_value = /*host*/ ctx[3].HostEntityType + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*hosts*/ 1 && option_value_value !== (option_value_value = JSON.stringify(/*host*/ ctx[3]))) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(27:4) {#each hosts as host}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let strong;
    	let t5;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;
    	let if_block = /*hosts*/ ctx[0].length > 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "Set a previous created host entity active to handle storyline selection or match against.";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "If no host is available create one first.";
    			t3 = space();
    			p2 = element("p");
    			strong = element("strong");
    			strong.textContent = "This is no real API step because host id and type should be direct submitted from the client platform.";
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			button = element("button");
    			button.textContent = "Refresh Host List";
    			add_location(p0, file$2, 19, 0, 382);
    			add_location(p1, file$2, 20, 0, 479);
    			add_location(strong, file$2, 21, 3, 531);
    			add_location(p2, file$2, 21, 0, 528);
    			add_location(button, file$2, 32, 0, 908);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, strong);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*refreshList*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*hosts*/ ctx[0].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(t6.parentNode, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HostList', slots, []);
    	let hosts = [];

    	const refreshList = async () => {
    		let response = await getAllHosts();

    		if (response) {
    			$$invalidate(0, hosts = JSON.parse(response));
    		}
    	};

    	const setBaseHost = event => {
    		let selected = event.currentTarget.value;
    		base_host.set(selected);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HostList> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getAllHosts,
    		base_host,
    		hosts,
    		refreshList,
    		setBaseHost
    	});

    	$$self.$inject_state = $$props => {
    		if ('hosts' in $$props) $$invalidate(0, hosts = $$props.hosts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [hosts, refreshList, setBaseHost];
    }

    class HostList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HostList",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\GetReport.svelte generated by Svelte v3.46.2 */
    const file$1 = "src\\components\\GetReport.svelte";

    // (22:0) {#if report.length > 0 }
    function create_if_block(ctx) {
    	let h3;
    	let t1;
    	let p;
    	let t3;
    	let div;
    	let t4;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			h3.textContent = "Current report selection";
    			t1 = space();
    			p = element("p");
    			p.textContent = "Getting the currently selected report for a given storyline / host. Report text or false";
    			t3 = space();
    			div = element("div");
    			t4 = text(/*report*/ ctx[0]);
    			add_location(h3, file$1, 22, 0, 687);
    			add_location(p, file$1, 23, 2, 723);
    			add_location(div, file$1, 26, 3, 832);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*report*/ 1) set_data_dev(t4, /*report*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(22:0) {#if report.length > 0 }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let button;
    	let t1;
    	let if_block_anchor;
    	let mounted;
    	let dispose;
    	let if_block = /*report*/ ctx[0].length > 0 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Get Report";
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(button, file$1, 20, 0, 606);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*getCurrentReport*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*report*/ ctx[0].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GetReport', slots, []);
    	let report = '';

    	const getCurrentReport = async () => {
    		// Call with example id and type
    		//let response = await getStoryline('user', '111');
    		// Take current host from stored value
    		let currentHost = JSON.parse(get_store_value(base_host));

    		let response = await getReport(currentHost.HostEntityType, currentHost.HostEntityId);

    		if (response) {
    			$$invalidate(0, report = response.Report);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GetReport> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getReport,
    		base_host,
    		get: get_store_value,
    		report,
    		getCurrentReport
    	});

    	$$self.$inject_state = $$props => {
    		if ('report' in $$props) $$invalidate(0, report = $$props.report);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [report, getCurrentReport];
    }

    class GetReport extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GetReport",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.46.2 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let p;
    	let t5;
    	let details0;
    	let summary0;
    	let t7;
    	let div0;
    	let hostlist;
    	let t8;
    	let details1;
    	let summary1;
    	let t10;
    	let div1;
    	let createhost;
    	let t11;
    	let details2;
    	let summary2;
    	let t13;
    	let div2;
    	let getstories;
    	let t14;
    	let details3;
    	let summary3;
    	let t16;
    	let div3;
    	let getstoryline;
    	let t17;
    	let details4;
    	let summary4;
    	let t19;
    	let div4;
    	let getreport;
    	let t20;
    	let details5;
    	let summary5;
    	let t22;
    	let getmatching;
    	let t23;
    	let details6;
    	let summary6;
    	let t25;
    	let deletehost;
    	let current;
    	hostlist = new HostList({ $$inline: true });
    	createhost = new CreateHost({ $$inline: true });
    	getstories = new GetStories({ $$inline: true });
    	getstoryline = new GetStoryline({ $$inline: true });
    	getreport = new GetReport({ $$inline: true });
    	getmatching = new GetMatching({ $$inline: true });
    	deletehost = new DeleteHost({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "Storymatcher";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "API Test";
    			t3 = space();
    			p = element("p");
    			p.textContent = "All data objects are logged at the browser debug console.";
    			t5 = space();
    			details0 = element("details");
    			summary0 = element("summary");
    			summary0.textContent = "Set current storyline host.";
    			t7 = space();
    			div0 = element("div");
    			create_component(hostlist.$$.fragment);
    			t8 = space();
    			details1 = element("details");
    			summary1 = element("summary");
    			summary1.textContent = "Create a host entity";
    			t10 = space();
    			div1 = element("div");
    			create_component(createhost.$$.fragment);
    			t11 = space();
    			details2 = element("details");
    			summary2 = element("summary");
    			summary2.textContent = "Set storyline";
    			t13 = space();
    			div2 = element("div");
    			create_component(getstories.$$.fragment);
    			t14 = space();
    			details3 = element("details");
    			summary3 = element("summary");
    			summary3.textContent = "Get current storyline";
    			t16 = space();
    			div3 = element("div");
    			create_component(getstoryline.$$.fragment);
    			t17 = space();
    			details4 = element("details");
    			summary4 = element("summary");
    			summary4.textContent = "Get current report";
    			t19 = space();
    			div4 = element("div");
    			create_component(getreport.$$.fragment);
    			t20 = space();
    			details5 = element("details");
    			summary5 = element("summary");
    			summary5.textContent = "Get matching for current host";
    			t22 = space();
    			create_component(getmatching.$$.fragment);
    			t23 = space();
    			details6 = element("details");
    			summary6 = element("summary");
    			summary6.textContent = "Delete host entity";
    			t25 = space();
    			create_component(deletehost.$$.fragment);
    			attr_dev(h1, "class", "svelte-udljjg");
    			add_location(h1, file, 18, 1, 546);
    			attr_dev(h2, "class", "svelte-udljjg");
    			add_location(h2, file, 19, 1, 569);
    			add_location(p, file, 20, 1, 588);
    			attr_dev(summary0, "class", "svelte-udljjg");
    			add_location(summary0, file, 23, 2, 667);
    			attr_dev(div0, "class", "detailsWrapper svelte-udljjg");
    			add_location(div0, file, 24, 2, 716);
    			attr_dev(details0, "class", "svelte-udljjg");
    			add_location(details0, file, 22, 1, 655);
    			attr_dev(summary1, "class", "svelte-udljjg");
    			add_location(summary1, file, 29, 2, 803);
    			attr_dev(div1, "class", "detailsWrapper svelte-udljjg");
    			add_location(div1, file, 30, 2, 845);
    			attr_dev(details1, "class", "svelte-udljjg");
    			add_location(details1, file, 28, 1, 791);
    			attr_dev(summary2, "class", "svelte-udljjg");
    			add_location(summary2, file, 35, 2, 937);
    			attr_dev(div2, "class", "detailsWrapper svelte-udljjg");
    			add_location(div2, file, 36, 2, 972);
    			attr_dev(details2, "class", "svelte-udljjg");
    			add_location(details2, file, 34, 1, 925);
    			attr_dev(summary3, "class", "svelte-udljjg");
    			add_location(summary3, file, 41, 2, 1064);
    			attr_dev(div3, "class", "detailsWrapper svelte-udljjg");
    			add_location(div3, file, 42, 2, 1107);
    			attr_dev(details3, "class", "svelte-udljjg");
    			add_location(details3, file, 40, 1, 1052);
    			attr_dev(summary4, "class", "svelte-udljjg");
    			add_location(summary4, file, 47, 2, 1203);
    			attr_dev(div4, "class", "detailsWrapper svelte-udljjg");
    			add_location(div4, file, 48, 2, 1243);
    			attr_dev(details4, "class", "svelte-udljjg");
    			add_location(details4, file, 46, 1, 1191);
    			attr_dev(summary5, "class", "svelte-udljjg");
    			add_location(summary5, file, 54, 2, 1334);
    			attr_dev(details5, "class", "svelte-udljjg");
    			add_location(details5, file, 53, 1, 1322);
    			attr_dev(summary6, "class", "svelte-udljjg");
    			add_location(summary6, file, 58, 2, 1438);
    			attr_dev(details6, "class", "svelte-udljjg");
    			add_location(details6, file, 57, 1, 1426);
    			attr_dev(main, "class", "svelte-udljjg");
    			add_location(main, file, 17, 0, 538);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			append_dev(main, h2);
    			append_dev(main, t3);
    			append_dev(main, p);
    			append_dev(main, t5);
    			append_dev(main, details0);
    			append_dev(details0, summary0);
    			append_dev(details0, t7);
    			append_dev(details0, div0);
    			mount_component(hostlist, div0, null);
    			append_dev(main, t8);
    			append_dev(main, details1);
    			append_dev(details1, summary1);
    			append_dev(details1, t10);
    			append_dev(details1, div1);
    			mount_component(createhost, div1, null);
    			append_dev(main, t11);
    			append_dev(main, details2);
    			append_dev(details2, summary2);
    			append_dev(details2, t13);
    			append_dev(details2, div2);
    			mount_component(getstories, div2, null);
    			append_dev(main, t14);
    			append_dev(main, details3);
    			append_dev(details3, summary3);
    			append_dev(details3, t16);
    			append_dev(details3, div3);
    			mount_component(getstoryline, div3, null);
    			append_dev(main, t17);
    			append_dev(main, details4);
    			append_dev(details4, summary4);
    			append_dev(details4, t19);
    			append_dev(details4, div4);
    			mount_component(getreport, div4, null);
    			append_dev(main, t20);
    			append_dev(main, details5);
    			append_dev(details5, summary5);
    			append_dev(details5, t22);
    			mount_component(getmatching, details5, null);
    			append_dev(main, t23);
    			append_dev(main, details6);
    			append_dev(details6, summary6);
    			append_dev(details6, t25);
    			mount_component(deletehost, details6, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hostlist.$$.fragment, local);
    			transition_in(createhost.$$.fragment, local);
    			transition_in(getstories.$$.fragment, local);
    			transition_in(getstoryline.$$.fragment, local);
    			transition_in(getreport.$$.fragment, local);
    			transition_in(getmatching.$$.fragment, local);
    			transition_in(deletehost.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hostlist.$$.fragment, local);
    			transition_out(createhost.$$.fragment, local);
    			transition_out(getstories.$$.fragment, local);
    			transition_out(getstoryline.$$.fragment, local);
    			transition_out(getreport.$$.fragment, local);
    			transition_out(getmatching.$$.fragment, local);
    			transition_out(deletehost.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(hostlist);
    			destroy_component(createhost);
    			destroy_component(getstories);
    			destroy_component(getstoryline);
    			destroy_component(getreport);
    			destroy_component(getmatching);
    			destroy_component(deletehost);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	onMount(async () => {
    		login();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		lib,
    		GetStories,
    		CreateHost,
    		DeleteHost,
    		GetStoryline,
    		GetMatching,
    		HostList,
    		GetReport
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {

    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
