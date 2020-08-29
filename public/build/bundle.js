
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
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
        flushing = false;
        seen_callbacks.clear();
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

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
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
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const isActive = writable(false);
    const isComplete = writable(false);

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* src/components/Timer/Timer.svelte generated by Svelte v3.24.1 */
    const file = "src/components/Timer/Timer.svelte";

    function create_fragment(ctx) {
    	let div0;
    	let span0;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let span1;
    	let t4;
    	let t5;
    	let t6;
    	let div1;
    	let progress;
    	let progress_value_value;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(/*minutes*/ ctx[2]);
    			t1 = space();
    			t2 = text(/*minname*/ ctx[3]);
    			t3 = space();
    			span1 = element("span");
    			t4 = text(/*seconds*/ ctx[4]);
    			t5 = text("\n  s");
    			t6 = space();
    			div1 = element("div");
    			progress = element("progress");
    			attr_dev(span0, "class", "mins");
    			add_location(span0, file, 28, 2, 665);
    			attr_dev(span1, "class", "secs");
    			add_location(span1, file, 30, 2, 715);
    			attr_dev(div0, "class", "timer-item");
    			add_location(div0, file, 27, 0, 638);
    			progress.value = progress_value_value = /*$timer*/ ctx[1] / /*timeLimit*/ ctx[0];
    			add_location(progress, file, 34, 2, 789);
    			attr_dev(div1, "class", "timer-item");
    			add_location(div1, file, 33, 0, 762);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, span1);
    			append_dev(span1, t4);
    			append_dev(div0, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, progress);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*minutes*/ 4) set_data_dev(t0, /*minutes*/ ctx[2]);
    			if (dirty & /*minname*/ 8) set_data_dev(t2, /*minname*/ ctx[3]);
    			if (dirty & /*seconds*/ 16) set_data_dev(t4, /*seconds*/ ctx[4]);

    			if (dirty & /*$timer, timeLimit*/ 3 && progress_value_value !== (progress_value_value = /*$timer*/ ctx[1] / /*timeLimit*/ ctx[0])) {
    				prop_dev(progress, "value", progress_value_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
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
    	let $timer;
    	let { timeLimit } = $$props;
    	let isTimerActive;

    	isActive.subscribe(val => {
    		isTimerActive = val;
    	});

    	let timer = tweened(timeLimit);
    	validate_store(timer, "timer");
    	component_subscribe($$self, timer, value => $$invalidate(1, $timer = value));

    	setInterval(
    		() => {
    			if (isTimerActive) {
    				if ($timer > 0) set_store_value(timer, $timer--, $timer); else {
    					isComplete.set(true);
    					isActive.set(false);
    				}
    			}
    		},
    		1000
    	);

    	const writable_props = ["timeLimit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Timer", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("timeLimit" in $$props) $$invalidate(0, timeLimit = $$props.timeLimit);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		afterUpdate,
    		tweened,
    		isComplete,
    		isActive,
    		timeLimit,
    		isTimerActive,
    		timer,
    		$timer,
    		minutes,
    		minname,
    		seconds
    	});

    	$$self.$inject_state = $$props => {
    		if ("timeLimit" in $$props) $$invalidate(0, timeLimit = $$props.timeLimit);
    		if ("isTimerActive" in $$props) isTimerActive = $$props.isTimerActive;
    		if ("timer" in $$props) $$invalidate(5, timer = $$props.timer);
    		if ("minutes" in $$props) $$invalidate(2, minutes = $$props.minutes);
    		if ("minname" in $$props) $$invalidate(3, minname = $$props.minname);
    		if ("seconds" in $$props) $$invalidate(4, seconds = $$props.seconds);
    	};

    	let minutes;
    	let minname;
    	let seconds;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$timer*/ 2) {
    			 $$invalidate(2, minutes = Math.floor($timer / 60));
    		}

    		if ($$self.$$.dirty & /*minutes*/ 4) {
    			 $$invalidate(3, minname = minutes > 1 ? "mins" : "min");
    		}

    		if ($$self.$$.dirty & /*$timer, minutes*/ 6) {
    			 $$invalidate(4, seconds = Math.floor($timer - minutes * 60));
    		}
    	};

    	return [timeLimit, $timer, minutes, minname, seconds, timer];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { timeLimit: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*timeLimit*/ ctx[0] === undefined && !("timeLimit" in props)) {
    			console.warn("<Timer> was created without expected prop 'timeLimit'");
    		}
    	}

    	get timeLimit() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeLimit(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Words/Word.svelte generated by Svelte v3.24.1 */
    const file$1 = "src/components/Words/Word.svelte";

    function create_fragment$1(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*word*/ ctx[0]);
    			attr_dev(span, "class", "svelte-1sr4ad2");
    			toggle_class(span, "active", /*isActive*/ ctx[2]);
    			toggle_class(span, "incorrect-active", /*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === false);
    			toggle_class(span, "incorrect", !/*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === false);
    			toggle_class(span, "correct", !/*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === true);
    			add_location(span, file$1, 32, 0, 486);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    			/*span_binding*/ ctx[4](span);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*word*/ 1) set_data_dev(t, /*word*/ ctx[0]);

    			if (dirty & /*isActive*/ 4) {
    				toggle_class(span, "active", /*isActive*/ ctx[2]);
    			}

    			if (dirty & /*isActive, isCorrect*/ 6) {
    				toggle_class(span, "incorrect-active", /*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === false);
    			}

    			if (dirty & /*isActive, isCorrect*/ 6) {
    				toggle_class(span, "incorrect", !/*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === false);
    			}

    			if (dirty & /*isActive, isCorrect*/ 6) {
    				toggle_class(span, "correct", !/*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === true);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			/*span_binding*/ ctx[4](null);
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
    	let { word } = $$props;
    	let { isCorrect } = $$props;
    	let { isActive } = $$props;
    	let wordElement;

    	afterUpdate(() => {
    		isActive ? wordElement.scrollIntoView(false) : "";
    	});

    	const writable_props = ["word", "isCorrect", "isActive"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Word> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Word", $$slots, []);

    	function span_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			wordElement = $$value;
    			$$invalidate(3, wordElement);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("word" in $$props) $$invalidate(0, word = $$props.word);
    		if ("isCorrect" in $$props) $$invalidate(1, isCorrect = $$props.isCorrect);
    		if ("isActive" in $$props) $$invalidate(2, isActive = $$props.isActive);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		onMount,
    		word,
    		isCorrect,
    		isActive,
    		wordElement
    	});

    	$$self.$inject_state = $$props => {
    		if ("word" in $$props) $$invalidate(0, word = $$props.word);
    		if ("isCorrect" in $$props) $$invalidate(1, isCorrect = $$props.isCorrect);
    		if ("isActive" in $$props) $$invalidate(2, isActive = $$props.isActive);
    		if ("wordElement" in $$props) $$invalidate(3, wordElement = $$props.wordElement);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [word, isCorrect, isActive, wordElement, span_binding];
    }

    class Word extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { word: 0, isCorrect: 1, isActive: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Word",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*word*/ ctx[0] === undefined && !("word" in props)) {
    			console.warn("<Word> was created without expected prop 'word'");
    		}

    		if (/*isCorrect*/ ctx[1] === undefined && !("isCorrect" in props)) {
    			console.warn("<Word> was created without expected prop 'isCorrect'");
    		}

    		if (/*isActive*/ ctx[2] === undefined && !("isActive" in props)) {
    			console.warn("<Word> was created without expected prop 'isActive'");
    		}
    	}

    	get word() {
    		throw new Error("<Word>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set word(value) {
    		throw new Error("<Word>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isCorrect() {
    		throw new Error("<Word>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isCorrect(value) {
    		throw new Error("<Word>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isActive() {
    		throw new Error("<Word>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isActive(value) {
    		throw new Error("<Word>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Words/DisplayWords.svelte generated by Svelte v3.24.1 */
    const file$2 = "src/components/Words/DisplayWords.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (24:2) {#each words as word}
    function create_each_block(ctx) {
    	let word;
    	let t;
    	let br;
    	let current;
    	const word_spread_levels = [/*word*/ ctx[1]];
    	let word_props = {};

    	for (let i = 0; i < word_spread_levels.length; i += 1) {
    		word_props = assign(word_props, word_spread_levels[i]);
    	}

    	word = new Word({ props: word_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(word.$$.fragment);
    			t = space();
    			br = element("br");
    			add_location(br, file$2, 25, 4, 536);
    		},
    		m: function mount(target, anchor) {
    			mount_component(word, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const word_changes = (dirty & /*words*/ 1)
    			? get_spread_update(word_spread_levels, [get_spread_object(/*word*/ ctx[1])])
    			: {};

    			word.$set(word_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(word.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(word.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(word, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(24:2) {#each words as word}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let each_value = /*words*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "id", "words");
    			attr_dev(div, "class", "svelte-allzgk");
    			add_location(div, file$2, 22, 0, 468);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*words*/ 1) {
    				each_value = /*words*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
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
    			destroy_each(each_blocks, detaching);
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
    	let { words = [] } = $$props;
    	const writable_props = ["words"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DisplayWords> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DisplayWords", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("words" in $$props) $$invalidate(0, words = $$props.words);
    	};

    	$$self.$capture_state = () => ({
    		afterUpdate,
    		beforeUpdate,
    		onMount,
    		Timer,
    		isActive,
    		Word,
    		words
    	});

    	$$self.$inject_state = $$props => {
    		if ("words" in $$props) $$invalidate(0, words = $$props.words);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [words];
    }

    class DisplayWords extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { words: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DisplayWords",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get words() {
    		throw new Error("<DisplayWords>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set words(value) {
    		throw new Error("<DisplayWords>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Words/TestForm.svelte generated by Svelte v3.24.1 */

    const { console: console_1 } = globals;
    const file$3 = "src/components/Words/TestForm.svelte";

    function create_fragment$3(ctx) {
    	let displaywords;
    	let t;
    	let div;
    	let current;
    	let mounted;
    	let dispose;

    	displaywords = new DisplayWords({
    			props: { words: /*words*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(displaywords.$$.fragment);
    			t = space();
    			div = element("div");
    			attr_dev(div, "class", "typing_input svelte-4aoqt4");
    			attr_dev(div, "contenteditable", "true");
    			if (/*userInput*/ ctx[1] === void 0) add_render_callback(() => /*div_input_handler*/ ctx[4].call(div));
    			add_location(div, file$3, 99, 0, 2484);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(displaywords, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			if (/*userInput*/ ctx[1] !== void 0) {
    				div.innerHTML = /*userInput*/ ctx[1];
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "keydown", /*startTimer*/ ctx[2], { once: true }, false, false),
    					listen_dev(div, "keydown", /*handleInput*/ ctx[3], false, false, false),
    					listen_dev(div, "input", /*div_input_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const displaywords_changes = {};
    			if (dirty & /*words*/ 1) displaywords_changes.words = /*words*/ ctx[0];
    			displaywords.$set(displaywords_changes);

    			if (dirty & /*userInput*/ 2 && /*userInput*/ ctx[1] !== div.innerHTML) {
    				div.innerHTML = /*userInput*/ ctx[1];
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(displaywords.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(displaywords.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(displaywords, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
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
    	let { words } = $$props;
    	let userInput = "";
    	let current = "";
    	let stats = { numWords: 0, correct: 0 };

    	// onMount(() => {
    	//   document.getElementById("test_input").focus();
    	// });
    	const startTimer = () => {
    		isActive.update(val => val = true);
    	};

    	const handleInput = e => {
    		current = words[stats.numWords];
    		console.log(current);

    		// Check current progress
    		if (userInput !== current.word.substr(0, userInput.length)) {
    			current.isCorrect = false;
    			$$invalidate(0, words[stats.numWords] = { ...current }, words);
    		} else // Reset correct-ness
    		{
    			current.isCorrect = null;
    			$$invalidate(0, words[stats.numWords] = { ...current }, words);
    		}

    		//Submit word on "space"
    		if (e.key == " ") {
    			e.preventDefault();

    			if (userInput === current.word) {
    				current.isCorrect = true;
    				stats.correct++;
    			} else {
    				current.isCorrect = false;
    			}

    			if (stats.numWords !== words.length) {
    				$$invalidate(0, words[stats.numWords + 1].isActive = true, words);
    			} //TODO: handle case where we run out of words before end of timer
    			//maybe check timer length and make additional fetch for more words?

    			current.isActive = false;
    			$$invalidate(0, words[stats.numWords] = { ...current }, words);
    			stats.numWords++;
    			$$invalidate(1, userInput = "");
    		} else // Skip word on "Enter"
    		if (e.key == "Enter") {
    			e.preventDefault();
    			current.isActive = false;
    			current.isCorrect = false;
    			$$invalidate(0, words[stats.numWords] = { ...current }, words);
    			$$invalidate(1, userInput = "");
    			stats.numWords++;

    			if (stats.numWords !== words.length) {
    				$$invalidate(0, words[stats.numWords].isActive = true, words);
    			} //TODO: handle case where we run out of words before end of timer
    		}
    	};

    	const writable_props = ["words"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TestForm> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TestForm", $$slots, []);

    	function div_input_handler() {
    		userInput = this.innerHTML;
    		$$invalidate(1, userInput);
    	}

    	$$self.$$set = $$props => {
    		if ("words" in $$props) $$invalidate(0, words = $$props.words);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		DisplayWords,
    		isActive,
    		words,
    		userInput,
    		current,
    		stats,
    		startTimer,
    		handleInput
    	});

    	$$self.$inject_state = $$props => {
    		if ("words" in $$props) $$invalidate(0, words = $$props.words);
    		if ("userInput" in $$props) $$invalidate(1, userInput = $$props.userInput);
    		if ("current" in $$props) current = $$props.current;
    		if ("stats" in $$props) stats = $$props.stats;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [words, userInput, startTimer, handleInput, div_input_handler];
    }

    class TestForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { words: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TestForm",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*words*/ ctx[0] === undefined && !("words" in props)) {
    			console_1.warn("<TestForm> was created without expected prop 'words'");
    		}
    	}

    	get words() {
    		throw new Error("<TestForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set words(value) {
    		throw new Error("<TestForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Header/Header.svelte generated by Svelte v3.24.1 */

    const file$4 = "src/components/Header/Header.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let h1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Typing Test";
    			add_location(h1, file$4, 5, 2, 29);
    			add_location(div, file$4, 4, 0, 21);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    		},
    		p: noop,
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

    function instance$4($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Header", $$slots, []);
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    // temp words to avoid overloading API endpoint
    const data = ["mislocate", "paleae", "festooning", "arciform", "mastectomies", "sterlings", "charily", "defoamers", "legating", "leses", "dopa", "neuronal", "firn", "transmogrified", "outvaunt", "cacomixls", "telfords", "kerchiefed", "smolts", "industrialist", "ecesic", "footfaults", "unstacked", "stewarded", "paella", "cantina", "alpacas", "superhardened", "murrhine", "stairwells", "imbody", "disembogued", "bandleaders", "andalusites", "engirdled", "forgets", "cottonmouth", "yapok", "monolithically", "globalising", "flailing", "permuted", "cullers", "scorner", "enders", "panzer", "alpenglow", "enrollments", "inflexion", "spreads"];

    /* src/components/TypingTest.svelte generated by Svelte v3.24.1 */

    const file$5 = "src/components/TypingTest.svelte";

    function create_fragment$5(ctx) {
    	let header;
    	let t0;
    	let div2;
    	let timer;
    	let t1;
    	let testform;
    	let t2;
    	let div0;
    	let t4;
    	let div1;
    	let p;
    	let t5;
    	let strong;
    	let t7;
    	let current;
    	header = new Header({ $$inline: true });
    	timer = new Timer({ props: { timeLimit }, $$inline: true });

    	testform = new TestForm({
    			props: { words: /*wordObjArr*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			create_component(timer.$$.fragment);
    			t1 = space();
    			create_component(testform.$$.fragment);
    			t2 = space();
    			div0 = element("div");
    			div0.textContent = "Begin typing to start the test!";
    			t4 = space();
    			div1 = element("div");
    			p = element("p");
    			t5 = text("Press\n      ");
    			strong = element("strong");
    			strong.textContent = "Enter";
    			t7 = text("\n      to skip the current word.");
    			add_location(div0, file$5, 64, 2, 1494);
    			add_location(strong, file$5, 69, 6, 1587);
    			add_location(p, file$5, 67, 4, 1565);
    			attr_dev(div1, "id", "help_text");
    			add_location(div1, file$5, 66, 2, 1540);
    			attr_dev(div2, "id", "test");
    			attr_dev(div2, "class", "svelte-5p20sc");
    			add_location(div2, file$5, 60, 0, 1417);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			mount_component(timer, div2, null);
    			append_dev(div2, t1);
    			mount_component(testform, div2, null);
    			append_dev(div2, t2);
    			append_dev(div2, div0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(p, t5);
    			append_dev(p, strong);
    			append_dev(p, t7);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const testform_changes = {};
    			if (dirty & /*wordObjArr*/ 1) testform_changes.words = /*wordObjArr*/ ctx[0];
    			testform.$set(testform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(timer.$$.fragment, local);
    			transition_in(testform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(timer.$$.fragment, local);
    			transition_out(testform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			destroy_component(timer);
    			destroy_component(testform);
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

    const timeLimit = 90;
    const numWords = 50;

    function instance$5($$self, $$props, $$invalidate) {
    	let isActive_value;
    	const timerActiveUnsubscribe = isActive.subscribe(val => isActive_value = val);
    	let isComplete_value;
    	const timerCompleteUnsubscribe = isComplete.subscribe(val => isComplete_value = val);
    	const apiUrl = `https://random-word-api.herokuapp.com/word?number=${numWords}`;

    	//let words = [];
    	let wordObjArr;

    	// onMount(async () => {
    	//   const res = await fetch(apiUrl);
    	//   words = await res.json();
    	// });
    	onMount(() => {
    		//TODO: move this to async onMount with fetch
    		$$invalidate(0, wordObjArr = data.map(word => {
    			return { word, isCorrect: null, isActive: false };
    		}));

    		$$invalidate(0, wordObjArr[0].isActive = true, wordObjArr);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TypingTest> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TypingTest", $$slots, []);

    	$$self.$capture_state = () => ({
    		onMount,
    		isActive,
    		isComplete,
    		Timer,
    		TestForm,
    		Header,
    		words: data,
    		isActive_value,
    		timerActiveUnsubscribe,
    		isComplete_value,
    		timerCompleteUnsubscribe,
    		timeLimit,
    		numWords,
    		apiUrl,
    		wordObjArr
    	});

    	$$self.$inject_state = $$props => {
    		if ("isActive_value" in $$props) isActive_value = $$props.isActive_value;
    		if ("isComplete_value" in $$props) isComplete_value = $$props.isComplete_value;
    		if ("wordObjArr" in $$props) $$invalidate(0, wordObjArr = $$props.wordObjArr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [wordObjArr];
    }

    class TypingTest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TypingTest",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$6 = "src/App.svelte";

    function create_fragment$6(ctx) {
    	let main;
    	let typingtest;
    	let current;
    	typingtest = new TypingTest({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(typingtest.$$.fragment);
    			add_location(main, file$6, 4, 0, 79);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(typingtest, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(typingtest.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(typingtest.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(typingtest);
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
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ TypingTest });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
