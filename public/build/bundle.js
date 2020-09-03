
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
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }

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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
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

    /* node_modules/svelte-loading-spinners/src/Circle2.svelte generated by Svelte v3.24.1 */

    const file = "node_modules/svelte-loading-spinners/src/Circle2.svelte";

    function create_fragment(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "circle svelte-gkf9c4");
    			set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			set_style(div, "--colorInner", /*colorInner*/ ctx[4]);
    			set_style(div, "--colorCenter", /*colorCenter*/ ctx[3]);
    			set_style(div, "--colorOuter", /*colorOuter*/ ctx[2]);
    			add_location(div, file, 53, 0, 1156);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 3) {
    				set_style(div, "--size", /*size*/ ctx[0] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*colorInner*/ 16) {
    				set_style(div, "--colorInner", /*colorInner*/ ctx[4]);
    			}

    			if (dirty & /*colorCenter*/ 8) {
    				set_style(div, "--colorCenter", /*colorCenter*/ ctx[3]);
    			}

    			if (dirty & /*colorOuter*/ 4) {
    				set_style(div, "--colorOuter", /*colorOuter*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { size = 60 } = $$props;
    	let { unit = "px" } = $$props;
    	let { colorOuter = "#FF3E00" } = $$props;
    	let { colorCenter = "#40B3FF" } = $$props;
    	let { colorInner = "#676778" } = $$props;
    	const writable_props = ["size", "unit", "colorOuter", "colorCenter", "colorInner"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Circle2> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Circle2", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("colorOuter" in $$props) $$invalidate(2, colorOuter = $$props.colorOuter);
    		if ("colorCenter" in $$props) $$invalidate(3, colorCenter = $$props.colorCenter);
    		if ("colorInner" in $$props) $$invalidate(4, colorInner = $$props.colorInner);
    	};

    	$$self.$capture_state = () => ({
    		size,
    		unit,
    		colorOuter,
    		colorCenter,
    		colorInner
    	});

    	$$self.$inject_state = $$props => {
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("colorOuter" in $$props) $$invalidate(2, colorOuter = $$props.colorOuter);
    		if ("colorCenter" in $$props) $$invalidate(3, colorCenter = $$props.colorCenter);
    		if ("colorInner" in $$props) $$invalidate(4, colorInner = $$props.colorInner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [size, unit, colorOuter, colorCenter, colorInner];
    }

    class Circle2 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			size: 0,
    			unit: 1,
    			colorOuter: 2,
    			colorCenter: 3,
    			colorInner: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Circle2",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get size() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unit() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unit(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorOuter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorOuter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorCenter() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorCenter(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get colorInner() {
    		throw new Error("<Circle2>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set colorInner(value) {
    		throw new Error("<Circle2>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
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
    const file$1 = "src/components/Timer/Timer.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let progress;
    	let progress_value_value;
    	let t0;
    	let div0;
    	let span0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let span1;
    	let t5;
    	let t6;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			progress = element("progress");
    			t0 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t1 = text(/*minutes*/ ctx[2]);
    			t2 = space();
    			t3 = text(/*minname*/ ctx[3]);
    			t4 = space();
    			span1 = element("span");
    			t5 = text(/*seconds*/ ctx[4]);
    			t6 = text(" s");
    			progress.value = progress_value_value = /*$timer*/ ctx[1] / /*timeLimit*/ ctx[0];
    			attr_dev(progress, "class", "svelte-i4kawh");
    			add_location(progress, file$1, 61, 2, 1283);
    			attr_dev(span0, "class", "mins svelte-i4kawh");
    			add_location(span0, file$1, 64, 4, 1336);
    			attr_dev(span1, "class", "secs svelte-i4kawh");
    			add_location(span1, file$1, 66, 4, 1390);
    			add_location(div0, file$1, 63, 2, 1326);
    			attr_dev(div1, "class", "timer-container svelte-i4kawh");
    			add_location(div1, file$1, 60, 0, 1251);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, progress);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, span1);
    			append_dev(span1, t5);
    			append_dev(div0, t6);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$timer, timeLimit*/ 3 && progress_value_value !== (progress_value_value = /*$timer*/ ctx[1] / /*timeLimit*/ ctx[0])) {
    				prop_dev(progress, "value", progress_value_value);
    			}

    			if (dirty & /*minutes*/ 4) set_data_dev(t1, /*minutes*/ ctx[2]);
    			if (dirty & /*minname*/ 8) set_data_dev(t3, /*minname*/ ctx[3]);
    			if (dirty & /*seconds*/ 16) set_data_dev(t5, /*seconds*/ ctx[4]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let $timer;
    	let { timeLimit } = $$props;
    	let { isTimerActive } = $$props;
    	let { isTimerComplete } = $$props;
    	let { testStarted } = $$props;

    	// let isTimerActive;
    	// isActive.subscribe((val) => {
    	//   isTimerActive = val;
    	// });
    	let timer = tweened(timeLimit);

    	validate_store(timer, "timer");
    	component_subscribe($$self, timer, value => $$invalidate(1, $timer = value));

    	setInterval(
    		() => {
    			if (isTimerActive) {
    				if ($timer > 0) set_store_value(timer, $timer--, $timer); else {
    					$$invalidate(6, isTimerActive = false);
    					$$invalidate(7, isTimerComplete = true);
    					$$invalidate(8, testStarted = false);
    				}
    			}
    		},
    		1000
    	);

    	const writable_props = ["timeLimit", "isTimerActive", "isTimerComplete", "testStarted"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Timer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Timer", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("timeLimit" in $$props) $$invalidate(0, timeLimit = $$props.timeLimit);
    		if ("isTimerActive" in $$props) $$invalidate(6, isTimerActive = $$props.isTimerActive);
    		if ("isTimerComplete" in $$props) $$invalidate(7, isTimerComplete = $$props.isTimerComplete);
    		if ("testStarted" in $$props) $$invalidate(8, testStarted = $$props.testStarted);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		afterUpdate,
    		tweened,
    		timeLimit,
    		isTimerActive,
    		isTimerComplete,
    		testStarted,
    		timer,
    		$timer,
    		minutes,
    		minname,
    		seconds
    	});

    	$$self.$inject_state = $$props => {
    		if ("timeLimit" in $$props) $$invalidate(0, timeLimit = $$props.timeLimit);
    		if ("isTimerActive" in $$props) $$invalidate(6, isTimerActive = $$props.isTimerActive);
    		if ("isTimerComplete" in $$props) $$invalidate(7, isTimerComplete = $$props.isTimerComplete);
    		if ("testStarted" in $$props) $$invalidate(8, testStarted = $$props.testStarted);
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

    	return [
    		timeLimit,
    		$timer,
    		minutes,
    		minname,
    		seconds,
    		timer,
    		isTimerActive,
    		isTimerComplete,
    		testStarted
    	];
    }

    class Timer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			timeLimit: 0,
    			isTimerActive: 6,
    			isTimerComplete: 7,
    			testStarted: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Timer",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*timeLimit*/ ctx[0] === undefined && !("timeLimit" in props)) {
    			console.warn("<Timer> was created without expected prop 'timeLimit'");
    		}

    		if (/*isTimerActive*/ ctx[6] === undefined && !("isTimerActive" in props)) {
    			console.warn("<Timer> was created without expected prop 'isTimerActive'");
    		}

    		if (/*isTimerComplete*/ ctx[7] === undefined && !("isTimerComplete" in props)) {
    			console.warn("<Timer> was created without expected prop 'isTimerComplete'");
    		}

    		if (/*testStarted*/ ctx[8] === undefined && !("testStarted" in props)) {
    			console.warn("<Timer> was created without expected prop 'testStarted'");
    		}
    	}

    	get timeLimit() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeLimit(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isTimerActive() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isTimerActive(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isTimerComplete() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isTimerComplete(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get testStarted() {
    		throw new Error("<Timer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set testStarted(value) {
    		throw new Error("<Timer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Test/Word.svelte generated by Svelte v3.24.1 */
    const file$2 = "src/components/Test/Word.svelte";

    function create_fragment$2(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*word*/ ctx[0]);
    			attr_dev(span, "class", "svelte-1q002f0");
    			toggle_class(span, "active", /*isActive*/ ctx[2]);
    			toggle_class(span, "incorrect-active", /*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === false);
    			toggle_class(span, "incorrect", !/*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === false);
    			toggle_class(span, "correct", !/*isActive*/ ctx[2] && /*isCorrect*/ ctx[1] === true);
    			add_location(span, file$2, 33, 0, 521);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { word: 0, isCorrect: 1, isActive: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Word",
    			options,
    			id: create_fragment$2.name
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

    /* src/components/Test/DisplayWords.svelte generated by Svelte v3.24.1 */
    const file$3 = "src/components/Test/DisplayWords.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (19:2) {#each words as word, i}
    function create_each_block(ctx) {
    	let word;
    	let t;
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
    		},
    		m: function mount(target, anchor) {
    			mount_component(word, target, anchor);
    			insert_dev(target, t, anchor);
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
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(19:2) {#each words as word, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
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
    			attr_dev(div, "class", "svelte-15ykn82");
    			add_location(div, file$3, 17, 0, 283);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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

    	$$self.$capture_state = () => ({ Word, words });

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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { words: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DisplayWords",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get words() {
    		throw new Error("<DisplayWords>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set words(value) {
    		throw new Error("<DisplayWords>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Test/TestForm.svelte generated by Svelte v3.24.1 */
    const file$4 = "src/components/Test/TestForm.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let displaywords;
    	let t;
    	let input;
    	let current;
    	let mounted;
    	let dispose;

    	displaywords = new DisplayWords({
    			props: { words: /*words*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(displaywords.$$.fragment);
    			t = space();
    			input = element("input");
    			attr_dev(input, "class", "typing-input svelte-bltuvo");
    			add_location(input, file$4, 91, 2, 2345);
    			attr_dev(div, "class", "container svelte-bltuvo");
    			add_location(div, file$4, 88, 0, 2291);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(displaywords, div, null);
    			append_dev(div, t);
    			append_dev(div, input);
    			/*input_binding*/ ctx[7](input);
    			set_input_value(input, /*userInput*/ ctx[1]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(input, "keydown", /*startTimer*/ ctx[3], { once: true }, false, false),
    					listen_dev(input, "keydown", /*handleInput*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const displaywords_changes = {};
    			if (dirty & /*words*/ 1) displaywords_changes.words = /*words*/ ctx[0];
    			displaywords.$set(displaywords_changes);

    			if (dirty & /*userInput*/ 2 && input.value !== /*userInput*/ ctx[1]) {
    				set_input_value(input, /*userInput*/ ctx[1]);
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
    			if (detaching) detach_dev(div);
    			destroy_component(displaywords);
    			/*input_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
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
    	let { words } = $$props;
    	let { isTimerActive } = $$props;
    	let { gameStats } = $$props;
    	let userInput = "";
    	let inputElement;
    	let current = "";

    	onMount(() => {
    		inputElement.focus();
    	});

    	const startTimer = () => {
    		$$invalidate(5, isTimerActive = true);
    	};

    	const handleInput = e => {
    		//TODO: Can this be refactored? A lot going on here
    		current = words[gameStats.numWords];

    		// Check current progress
    		if (userInput !== current.word.substr(0, userInput.length)) {
    			current.isCorrect = false;
    			$$invalidate(0, words[gameStats.numWords] = { ...current }, words);
    		} else // Reset correct-ness
    		{
    			current.isCorrect = null;
    			$$invalidate(0, words[gameStats.numWords] = { ...current }, words);
    		}

    		//Submit word on "space"
    		if (e.key == " ") {
    			e.preventDefault();

    			if (userInput === current.word) {
    				current.isCorrect = true;
    				$$invalidate(6, gameStats.correctWords++, gameStats);
    			} else {
    				current.isCorrect = false;
    			}

    			if (gameStats.numWords !== words.length) {
    				$$invalidate(0, words[gameStats.numWords + 1].isActive = true, words);
    			} //TODO: handle case where we run out of words before end of timer
    			//maybe check timer length and make additional fetch for more words?

    			current.isActive = false;
    			$$invalidate(0, words[gameStats.numWords] = { ...current }, words);
    			$$invalidate(6, gameStats.numWords++, gameStats);
    			$$invalidate(1, userInput = "");
    		} else // Skip word on "Enter"
    		if (e.key == "Enter") {
    			e.preventDefault();
    			current.isActive = false;
    			current.isCorrect = false;
    			$$invalidate(0, words[gameStats.numWords] = { ...current }, words);
    			$$invalidate(1, userInput = "");
    			$$invalidate(6, gameStats.numWords++, gameStats);

    			if (gameStats.numWords !== words.length) {
    				$$invalidate(0, words[gameStats.numWords].isActive = true, words);
    			} //TODO: handle case where we run out of words before end of timer
    		}
    	};

    	const writable_props = ["words", "isTimerActive", "gameStats"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TestForm> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TestForm", $$slots, []);

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			inputElement = $$value;
    			$$invalidate(2, inputElement);
    		});
    	}

    	function input_input_handler() {
    		userInput = this.value;
    		$$invalidate(1, userInput);
    	}

    	$$self.$$set = $$props => {
    		if ("words" in $$props) $$invalidate(0, words = $$props.words);
    		if ("isTimerActive" in $$props) $$invalidate(5, isTimerActive = $$props.isTimerActive);
    		if ("gameStats" in $$props) $$invalidate(6, gameStats = $$props.gameStats);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		afterUpdate,
    		DisplayWords,
    		words,
    		isTimerActive,
    		gameStats,
    		userInput,
    		inputElement,
    		current,
    		startTimer,
    		handleInput
    	});

    	$$self.$inject_state = $$props => {
    		if ("words" in $$props) $$invalidate(0, words = $$props.words);
    		if ("isTimerActive" in $$props) $$invalidate(5, isTimerActive = $$props.isTimerActive);
    		if ("gameStats" in $$props) $$invalidate(6, gameStats = $$props.gameStats);
    		if ("userInput" in $$props) $$invalidate(1, userInput = $$props.userInput);
    		if ("inputElement" in $$props) $$invalidate(2, inputElement = $$props.inputElement);
    		if ("current" in $$props) current = $$props.current;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		words,
    		userInput,
    		inputElement,
    		startTimer,
    		handleInput,
    		isTimerActive,
    		gameStats,
    		input_binding,
    		input_input_handler
    	];
    }

    class TestForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { words: 0, isTimerActive: 5, gameStats: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TestForm",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*words*/ ctx[0] === undefined && !("words" in props)) {
    			console.warn("<TestForm> was created without expected prop 'words'");
    		}

    		if (/*isTimerActive*/ ctx[5] === undefined && !("isTimerActive" in props)) {
    			console.warn("<TestForm> was created without expected prop 'isTimerActive'");
    		}

    		if (/*gameStats*/ ctx[6] === undefined && !("gameStats" in props)) {
    			console.warn("<TestForm> was created without expected prop 'gameStats'");
    		}
    	}

    	get words() {
    		throw new Error("<TestForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set words(value) {
    		throw new Error("<TestForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isTimerActive() {
    		throw new Error("<TestForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isTimerActive(value) {
    		throw new Error("<TestForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gameStats() {
    		throw new Error("<TestForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameStats(value) {
    		throw new Error("<TestForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Header/Header.svelte generated by Svelte v3.24.1 */

    const file$5 = "src/components/Header/Header.svelte";

    function create_fragment$5(ctx) {
    	let header;
    	let h1;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Typing Test";
    			add_location(h1, file$5, 15, 2, 175);
    			attr_dev(header, "class", "svelte-qmff0m");
    			add_location(header, file$5, 14, 0, 164);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
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

    function instance$5($$self, $$props) {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/components/Footer/Footer.svelte generated by Svelte v3.24.1 */

    const file$6 = "src/components/Footer/Footer.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let a;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			a.textContent = "View source on Github";
    			attr_dev(a, "href", "https://github.com/mdjohns/svelte_type");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			attr_dev(a, "class", "svelte-16zl4zk");
    			add_location(a, file$6, 28, 2, 394);
    			attr_dev(div, "class", "svelte-16zl4zk");
    			add_location(div, file$6, 27, 0, 386);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Footer", $$slots, []);
    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Error/ErrorMessage.svelte generated by Svelte v3.24.1 */

    const file$7 = "src/components/Error/ErrorMessage.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let code;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Oops, sorry about that.";
    			t1 = space();
    			code = element("code");
    			t2 = text(/*error*/ ctx[0]);
    			attr_dev(h3, "class", "svelte-1a6zhtb");
    			add_location(h3, file$7, 20, 2, 195);
    			attr_dev(code, "class", "svelte-1a6zhtb");
    			add_location(code, file$7, 21, 2, 230);
    			attr_dev(div, "class", "svelte-1a6zhtb");
    			add_location(div, file$7, 19, 0, 187);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);
    			append_dev(div, code);
    			append_dev(code, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*error*/ 1) set_data_dev(t2, /*error*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	let { error } = $$props;
    	const writable_props = ["error"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ErrorMessage> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("ErrorMessage", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("error" in $$props) $$invalidate(0, error = $$props.error);
    	};

    	$$self.$capture_state = () => ({ error });

    	$$self.$inject_state = $$props => {
    		if ("error" in $$props) $$invalidate(0, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [error];
    }

    class ErrorMessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { error: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ErrorMessage",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*error*/ ctx[0] === undefined && !("error" in props)) {
    			console.warn("<ErrorMessage> was created without expected prop 'error'");
    		}
    	}

    	get error() {
    		throw new Error("<ErrorMessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set error(value) {
    		throw new Error("<ErrorMessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Test/Results.svelte generated by Svelte v3.24.1 */

    const file$8 = "src/components/Test/Results.svelte";

    function create_fragment$8(ctx) {
    	let section;
    	let h2;
    	let t1;
    	let span0;
    	let t2;
    	let t3_value = /*gameStats*/ ctx[0].numWords + "";
    	let t3;
    	let t4;
    	let span1;
    	let t5;
    	let t6_value = /*gameStats*/ ctx[0].correctWords + "";
    	let t6;
    	let t7;
    	let span2;
    	let t8;
    	let t9;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			h2.textContent = "Results";
    			t1 = space();
    			span0 = element("span");
    			t2 = text("Number of Words: ");
    			t3 = text(t3_value);
    			t4 = space();
    			span1 = element("span");
    			t5 = text("Correct Words: ");
    			t6 = text(t6_value);
    			t7 = space();
    			span2 = element("span");
    			t8 = text("Word Per Minute: ");
    			t9 = text(/*wpm*/ ctx[1]);
    			add_location(h2, file$8, 24, 2, 409);
    			attr_dev(span0, "class", "svelte-1p51gm0");
    			add_location(span0, file$8, 26, 2, 429);
    			attr_dev(span1, "class", "svelte-1p51gm0");
    			add_location(span1, file$8, 27, 2, 482);
    			attr_dev(span2, "class", "svelte-1p51gm0");
    			add_location(span2, file$8, 28, 2, 537);
    			attr_dev(section, "class", "svelte-1p51gm0");
    			add_location(section, file$8, 23, 0, 397);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(section, t1);
    			append_dev(section, span0);
    			append_dev(span0, t2);
    			append_dev(span0, t3);
    			append_dev(section, t4);
    			append_dev(section, span1);
    			append_dev(span1, t5);
    			append_dev(span1, t6);
    			append_dev(section, t7);
    			append_dev(section, span2);
    			append_dev(span2, t8);
    			append_dev(span2, t9);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*gameStats*/ 1 && t3_value !== (t3_value = /*gameStats*/ ctx[0].numWords + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*gameStats*/ 1 && t6_value !== (t6_value = /*gameStats*/ ctx[0].correctWords + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*wpm*/ 2) set_data_dev(t9, /*wpm*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
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
    	let { gameStats } = $$props;
    	let { timeLimit } = $$props;
    	const writable_props = ["gameStats", "timeLimit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Results> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Results", $$slots, []);

    	$$self.$$set = $$props => {
    		if ("gameStats" in $$props) $$invalidate(0, gameStats = $$props.gameStats);
    		if ("timeLimit" in $$props) $$invalidate(2, timeLimit = $$props.timeLimit);
    	};

    	$$self.$capture_state = () => ({ gameStats, timeLimit, wpm });

    	$$self.$inject_state = $$props => {
    		if ("gameStats" in $$props) $$invalidate(0, gameStats = $$props.gameStats);
    		if ("timeLimit" in $$props) $$invalidate(2, timeLimit = $$props.timeLimit);
    		if ("wpm" in $$props) $$invalidate(1, wpm = $$props.wpm);
    	};

    	let wpm;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*gameStats, timeLimit*/ 5) {
    			 $$invalidate(1, wpm = (gameStats.correctWords / timeLimit * 60).toFixed(1));
    		}
    	};

    	return [gameStats, wpm, timeLimit];
    }

    class Results extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { gameStats: 0, timeLimit: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Results",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*gameStats*/ ctx[0] === undefined && !("gameStats" in props)) {
    			console.warn("<Results> was created without expected prop 'gameStats'");
    		}

    		if (/*timeLimit*/ ctx[2] === undefined && !("timeLimit" in props)) {
    			console.warn("<Results> was created without expected prop 'timeLimit'");
    		}
    	}

    	get gameStats() {
    		throw new Error("<Results>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameStats(value) {
    		throw new Error("<Results>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get timeLimit() {
    		throw new Error("<Results>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set timeLimit(value) {
    		throw new Error("<Results>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const colors = {
        'bg': '#4c566a',
        'darkBg': '#3b4252',
        'text': '#eceff4',
        'active': '#b48ead',
        'incorrect': '#bf616a',
        'correct': '#a3be8c'


    };

    var Styles = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': colors
    });

    /* src/components/TypingTest.svelte generated by Svelte v3.24.1 */
    const file$9 = "src/components/TypingTest.svelte";

    // (90:2) {#if testStarted}
    function create_if_block_1(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 6,
    		error: 15,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*fetchAndMapWords*/ ctx[5](), info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			{
    				const child_ctx = ctx.slice();
    				child_ctx[6] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(90:2) {#if testStarted}",
    		ctx
    	});

    	return block;
    }

    // (115:4) {:catch error}
    function create_catch_block(ctx) {
    	let errormessage;
    	let current;

    	errormessage = new ErrorMessage({
    			props: { error: /*error*/ ctx[15] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(errormessage.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(errormessage, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(errormessage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(errormessage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(errormessage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(115:4) {:catch error}",
    		ctx
    	});

    	return block;
    }

    // (93:4) {:then wordsMapped}
    function create_then_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = !/*isTimerComplete*/ ctx[2] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!/*isTimerComplete*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isTimerComplete*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(93:4) {:then wordsMapped}",
    		ctx
    	});

    	return block;
    }

    // (94:6) {#if !isTimerComplete}
    function create_if_block_2(ctx) {
    	let section0;
    	let timer;
    	let updating_isTimerActive;
    	let updating_isTimerComplete;
    	let updating_testStarted;
    	let t0;
    	let testform;
    	let updating_isTimerActive_1;
    	let updating_isTimerComplete_1;
    	let updating_gameStats;
    	let t1;
    	let section1;
    	let span0;
    	let t3;
    	let br;
    	let t4;
    	let span1;
    	let t5;
    	let strong;
    	let t7;
    	let current;

    	function timer_isTimerActive_binding(value) {
    		/*timer_isTimerActive_binding*/ ctx[7].call(null, value);
    	}

    	function timer_isTimerComplete_binding(value) {
    		/*timer_isTimerComplete_binding*/ ctx[8].call(null, value);
    	}

    	function timer_testStarted_binding(value) {
    		/*timer_testStarted_binding*/ ctx[9].call(null, value);
    	}

    	let timer_props = { timeLimit };

    	if (/*isTimerActive*/ ctx[1] !== void 0) {
    		timer_props.isTimerActive = /*isTimerActive*/ ctx[1];
    	}

    	if (/*isTimerComplete*/ ctx[2] !== void 0) {
    		timer_props.isTimerComplete = /*isTimerComplete*/ ctx[2];
    	}

    	if (/*testStarted*/ ctx[0] !== void 0) {
    		timer_props.testStarted = /*testStarted*/ ctx[0];
    	}

    	timer = new Timer({ props: timer_props, $$inline: true });
    	binding_callbacks.push(() => bind(timer, "isTimerActive", timer_isTimerActive_binding));
    	binding_callbacks.push(() => bind(timer, "isTimerComplete", timer_isTimerComplete_binding));
    	binding_callbacks.push(() => bind(timer, "testStarted", timer_testStarted_binding));

    	function testform_isTimerActive_binding(value) {
    		/*testform_isTimerActive_binding*/ ctx[10].call(null, value);
    	}

    	function testform_isTimerComplete_binding(value) {
    		/*testform_isTimerComplete_binding*/ ctx[11].call(null, value);
    	}

    	function testform_gameStats_binding(value) {
    		/*testform_gameStats_binding*/ ctx[12].call(null, value);
    	}

    	let testform_props = { words: /*wordsMapped*/ ctx[6] };

    	if (/*isTimerActive*/ ctx[1] !== void 0) {
    		testform_props.isTimerActive = /*isTimerActive*/ ctx[1];
    	}

    	if (/*isTimerComplete*/ ctx[2] !== void 0) {
    		testform_props.isTimerComplete = /*isTimerComplete*/ ctx[2];
    	}

    	if (/*gameStats*/ ctx[3] !== void 0) {
    		testform_props.gameStats = /*gameStats*/ ctx[3];
    	}

    	testform = new TestForm({ props: testform_props, $$inline: true });
    	binding_callbacks.push(() => bind(testform, "isTimerActive", testform_isTimerActive_binding));
    	binding_callbacks.push(() => bind(testform, "isTimerComplete", testform_isTimerComplete_binding));
    	binding_callbacks.push(() => bind(testform, "gameStats", testform_gameStats_binding));

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			create_component(timer.$$.fragment);
    			t0 = space();
    			create_component(testform.$$.fragment);
    			t1 = space();
    			section1 = element("section");
    			span0 = element("span");
    			span0.textContent = "Begin typing to start the test!";
    			t3 = space();
    			br = element("br");
    			t4 = space();
    			span1 = element("span");
    			t5 = text("Press ");
    			strong = element("strong");
    			strong.textContent = "Enter";
    			t7 = text(" to skip the current word.");
    			add_location(section0, file$9, 94, 8, 2329);
    			add_location(span0, file$9, 109, 10, 2689);
    			add_location(br, file$9, 110, 10, 2745);
    			add_location(strong, file$9, 111, 22, 2774);
    			add_location(span1, file$9, 111, 10, 2762);
    			attr_dev(section1, "class", "help-text svelte-86ctlz");
    			add_location(section1, file$9, 108, 8, 2651);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			mount_component(timer, section0, null);
    			append_dev(section0, t0);
    			mount_component(testform, section0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, span0);
    			append_dev(section1, t3);
    			append_dev(section1, br);
    			append_dev(section1, t4);
    			append_dev(section1, span1);
    			append_dev(span1, t5);
    			append_dev(span1, strong);
    			append_dev(span1, t7);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const timer_changes = {};

    			if (!updating_isTimerActive && dirty & /*isTimerActive*/ 2) {
    				updating_isTimerActive = true;
    				timer_changes.isTimerActive = /*isTimerActive*/ ctx[1];
    				add_flush_callback(() => updating_isTimerActive = false);
    			}

    			if (!updating_isTimerComplete && dirty & /*isTimerComplete*/ 4) {
    				updating_isTimerComplete = true;
    				timer_changes.isTimerComplete = /*isTimerComplete*/ ctx[2];
    				add_flush_callback(() => updating_isTimerComplete = false);
    			}

    			if (!updating_testStarted && dirty & /*testStarted*/ 1) {
    				updating_testStarted = true;
    				timer_changes.testStarted = /*testStarted*/ ctx[0];
    				add_flush_callback(() => updating_testStarted = false);
    			}

    			timer.$set(timer_changes);
    			const testform_changes = {};

    			if (!updating_isTimerActive_1 && dirty & /*isTimerActive*/ 2) {
    				updating_isTimerActive_1 = true;
    				testform_changes.isTimerActive = /*isTimerActive*/ ctx[1];
    				add_flush_callback(() => updating_isTimerActive_1 = false);
    			}

    			if (!updating_isTimerComplete_1 && dirty & /*isTimerComplete*/ 4) {
    				updating_isTimerComplete_1 = true;
    				testform_changes.isTimerComplete = /*isTimerComplete*/ ctx[2];
    				add_flush_callback(() => updating_isTimerComplete_1 = false);
    			}

    			if (!updating_gameStats && dirty & /*gameStats*/ 8) {
    				updating_gameStats = true;
    				testform_changes.gameStats = /*gameStats*/ ctx[3];
    				add_flush_callback(() => updating_gameStats = false);
    			}

    			testform.$set(testform_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(timer.$$.fragment, local);
    			transition_in(testform.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(timer.$$.fragment, local);
    			transition_out(testform.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section0);
    			destroy_component(timer);
    			destroy_component(testform);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(94:6) {#if !isTimerComplete}",
    		ctx
    	});

    	return block;
    }

    // (91:31)        <Circle2 size="60" colorInner="#81a1c1" colorOuter="#8fbcbb" unit="px" />     {:then wordsMapped}
    function create_pending_block(ctx) {
    	let circle2;
    	let current;

    	circle2 = new Circle2({
    			props: {
    				size: "60",
    				colorInner: "#81a1c1",
    				colorOuter: "#8fbcbb",
    				unit: "px"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(circle2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(circle2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(circle2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(circle2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(circle2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(91:31)        <Circle2 size=\\\"60\\\" colorInner=\\\"#81a1c1\\\" colorOuter=\\\"#8fbcbb\\\" unit=\\\"px\\\" />     {:then wordsMapped}",
    		ctx
    	});

    	return block;
    }

    // (119:2) {#if isTimerComplete && !testStarted}
    function create_if_block(ctx) {
    	let section;
    	let results;
    	let updating_gameStats;
    	let t0;
    	let div;
    	let span;
    	let current;
    	let mounted;
    	let dispose;

    	function results_gameStats_binding(value) {
    		/*results_gameStats_binding*/ ctx[13].call(null, value);
    	}

    	let results_props = { timeLimit };

    	if (/*gameStats*/ ctx[3] !== void 0) {
    		results_props.gameStats = /*gameStats*/ ctx[3];
    	}

    	results = new Results({ props: results_props, $$inline: true });
    	binding_callbacks.push(() => bind(results, "gameStats", results_gameStats_binding));

    	const block = {
    		c: function create() {
    			section = element("section");
    			create_component(results.$$.fragment);
    			t0 = space();
    			div = element("div");
    			span = element("span");
    			span.textContent = "Go again";
    			add_location(span, file$9, 121, 29, 3087);
    			attr_dev(div, "id", "reset-button");
    			attr_dev(div, "class", "svelte-86ctlz");
    			add_location(div, file$9, 121, 6, 3064);
    			attr_dev(section, "class", "results-container svelte-86ctlz");
    			add_location(section, file$9, 119, 4, 2977);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			mount_component(results, section, null);
    			append_dev(section, t0);
    			append_dev(section, div);
    			append_dev(div, span);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*reset*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const results_changes = {};

    			if (!updating_gameStats && dirty & /*gameStats*/ 8) {
    				updating_gameStats = true;
    				results_changes.gameStats = /*gameStats*/ ctx[3];
    				add_flush_callback(() => updating_gameStats = false);
    			}

    			results.$set(results_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(results.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(results.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(results);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(119:2) {#if isTimerComplete && !testStarted}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let header;
    	let t0;
    	let t1;
    	let t2;
    	let footer;
    	let current;
    	header = new Header({ $$inline: true });
    	let if_block0 = /*testStarted*/ ctx[0] && create_if_block_1(ctx);
    	let if_block1 = /*isTimerComplete*/ ctx[2] && !/*testStarted*/ ctx[0] && create_if_block(ctx);
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(header.$$.fragment);
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(div, "class", "flex-container svelte-86ctlz");
    			add_location(div, file$9, 87, 0, 2094);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(header, div, null);
    			append_dev(div, t0);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t2);
    			mount_component(footer, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*testStarted*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*testStarted*/ 1) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*isTimerComplete*/ ctx[2] && !/*testStarted*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*isTimerComplete, testStarted*/ 5) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t2);
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
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(header);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(footer);
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

    const timeLimit = 120;
    const numWords = 60;

    function instance$9($$self, $$props, $$invalidate) {
    	const apiUrl = `https://gimme-words.herokuapp.com/word?n=${numWords}`;
    	let wordsMapped;

    	async function reset() {
    		$$invalidate(1, isTimerActive = false);
    		$$invalidate(2, isTimerComplete = false);
    		$$invalidate(0, testStarted = true);
    		$$invalidate(3, gameStats.numWords = 0, gameStats);
    		$$invalidate(3, gameStats.correctWords = 0, gameStats);
    	} //TODO: get new words

    	async function fetchAndMapWords() {
    		const res = await fetch(apiUrl);
    		const words = await res.json();

    		const mapped = words.map(word => {
    			return { word, isCorrect: null, isActive: false };
    		});

    		mapped[0].isActive = true;
    		return mapped;
    	}

    	//let wordsMapped = fetchAndMapWords(numWords, apiUrl);
    	let testStarted = true;

    	let isTimerActive = false;
    	let isTimerComplete = false;
    	let gameStats = { numWords: 0, correctWords: 0 };
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TypingTest> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TypingTest", $$slots, []);

    	function timer_isTimerActive_binding(value) {
    		isTimerActive = value;
    		$$invalidate(1, isTimerActive);
    	}

    	function timer_isTimerComplete_binding(value) {
    		isTimerComplete = value;
    		$$invalidate(2, isTimerComplete);
    	}

    	function timer_testStarted_binding(value) {
    		testStarted = value;
    		$$invalidate(0, testStarted);
    	}

    	function testform_isTimerActive_binding(value) {
    		isTimerActive = value;
    		$$invalidate(1, isTimerActive);
    	}

    	function testform_isTimerComplete_binding(value) {
    		isTimerComplete = value;
    		$$invalidate(2, isTimerComplete);
    	}

    	function testform_gameStats_binding(value) {
    		gameStats = value;
    		$$invalidate(3, gameStats);
    	}

    	function results_gameStats_binding(value) {
    		gameStats = value;
    		$$invalidate(3, gameStats);
    	}

    	$$self.$capture_state = () => ({
    		Circle2,
    		Timer,
    		TestForm,
    		Header,
    		Footer,
    		ErrorMessage,
    		Results,
    		Styles,
    		beforeUpdate,
    		timeLimit,
    		numWords,
    		apiUrl,
    		wordsMapped,
    		reset,
    		fetchAndMapWords,
    		testStarted,
    		isTimerActive,
    		isTimerComplete,
    		gameStats
    	});

    	$$self.$inject_state = $$props => {
    		if ("wordsMapped" in $$props) $$invalidate(6, wordsMapped = $$props.wordsMapped);
    		if ("testStarted" in $$props) $$invalidate(0, testStarted = $$props.testStarted);
    		if ("isTimerActive" in $$props) $$invalidate(1, isTimerActive = $$props.isTimerActive);
    		if ("isTimerComplete" in $$props) $$invalidate(2, isTimerComplete = $$props.isTimerComplete);
    		if ("gameStats" in $$props) $$invalidate(3, gameStats = $$props.gameStats);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		testStarted,
    		isTimerActive,
    		isTimerComplete,
    		gameStats,
    		reset,
    		fetchAndMapWords,
    		wordsMapped,
    		timer_isTimerActive_binding,
    		timer_isTimerComplete_binding,
    		timer_testStarted_binding,
    		testform_isTimerActive_binding,
    		testform_isTimerComplete_binding,
    		testform_gameStats_binding,
    		results_gameStats_binding
    	];
    }

    class TypingTest extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TypingTest",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.24.1 */
    const file$a = "src/App.svelte";

    function create_fragment$a(ctx) {
    	let main;
    	let typingtest;
    	let current;
    	typingtest = new TypingTest({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(typingtest.$$.fragment);
    			add_location(main, file$a, 4, 0, 79);
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
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
