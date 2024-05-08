
	'use strict';

	const debug = false;
	const isPc = /Windows/i.test(window.navigator.userAgent);
	const isiOS = /ip(hone|ad|od)/i.test(window.navigator.userAgent);

	const replace = {
		'&' : '&amp;',
		'<' : '&lt;',
		'>' : '&gt;',
		'"' : '&quot;',
		'\'': '&#039;',
	};

	function nbr(string)
	{
		return string.replace(/(\r\n)+/g, '').replace(/\n/g, '<br />');
	}

	function htmlspecialchars(params)
	{
		if (typeof params !== 'string')
			return params;

		params = params.trim().replace(/[\r\n]+/g, '');
		for (const key in replace)
			params = params.replace(key, replace[key]);
		return params;
	}

	function str_shuffle(string)
	{
		let obj = {};
		// 文字列を文字数分繰り返す
		for (let i = 0; i < string.length; i++)
		{
			// let rand = Math.floor(Math.random() * string.length);
			let rand = Math.floor(Math.random() * 1000000000);
			if (obj[rand] == undefined) obj[rand] = string[i];
			else i--;
		}
		// 0.8172105996252195
		// valueのみを連結
		return Object.values(obj).join('');
	}

	function getMimeType(contentType)
	{
		// let r = new RegExp(/^.*\/(?<type>\S*)/gi)
		const result = /^.*\/(?<type>\S*)/gi.exec(contentType.split(';')[0]);
		console.log(result);
		return result.groups.type;
	}

	function copy_value(value, position)
	{
		Toast.clear('.toast');
		const t = new Toast();
		t.zindex(999);

		if (value == null || value == '')
		{
			t.show('コピーする値がありません.', position);
			return;
		}

		let e_tmp = $('body').create('input#_copyvalue');

		e_tmp.val(value);
		e_tmp.select();

		// navigator.clipboardは、
		// https（セキュア）環境でないとundefinedを返す
		// navigator.clipboard.writeText(value);
		document.execCommand('copy');

		e_tmp.remove();

		t.show(value, position);
		t.show('コピーしました.', position);
	}

	function httpRequest(url = null, params = null, func = null)
	{
		Toast.clear();
		let h = new Http();
		let r = h.json(url, params, '#container', func);
		return false;
	}

	function preview(file, obj)
	{
		//画像でない場合は処理終了
		if (!file.type.match(/^image.*/i))
			return;

		let image = null;
		let reader = new FileReader();
		reader.readAsDataURL(file);

		// ファイルオブジェクトを取得する
		reader.onloadend = function ()
		{
			image = obj.create('img').attr({ id: Date.now(), class: 'thumnail', src: reader.result });
			// console.log(reader);
			image.setcss('display: inline-block; margin: 5px; width: 20%; overflow: hidden; border: #4789B3 solid 2px;');
		}
	}

	function get_byte_size(num)
	{
		var unit = 'Kb';

		if (num == 0) return num + unit;

		num /= 1024;

		if (num > 1024) {
			num /= 1024;
			unit = 'Mb';
		}
		if (num > 1024) {
			num /= 1024;
			unit = 'Gb';
		}
		if (num > 1024) {
			num /= 1024;
			unit = 'Tb';
		}

		return Math.floor(num * 8) / 8 + unit;
	}

	function test(obj)
	{
		Object.keys(obj).forEach(function (key)
		{
			console.log(key);
			console.log(obj[key]);
		});
	}

	function convertTime(sec)
	{
		sec = toFloor(sec, 0);
		let hour = Math.floor(sec % 86400 / 3600);
		let min = Math.floor(sec % 3600 / 60);
		let rem = sec % 60;
		let time = '';
		if (hour > 0) time += hour.toString().padStart(2, '0') + ':';
		if (min >= 0) time += min.toString().padStart(2, '0') + ':';
		if (rem >= 0) time += rem.toString().padStart(2, '0');
		return time;
	}

	function toFloor(num, digit = 2)
	{
		const pow = Math.pow(10, digit);
		return digit == 0 ? Math.floor(num) : Math.floor(num * pow) / pow;
	}



	// function show(mess)
	// {
	// 	Toast.clear();
	// 	new Toast().show(mess);
	// 	return false;
	// }

	// 変数の中にクラスを定義し、
	// 変数を関数として呼ぶことでコンストラクタとしている...?
	// const cat = function()
	// {
	// }
	// const test = new cat();
	// console.log(Object.getPrototypeOf(window));

	// ojo3liblary
	// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Functions/Method_definitions#generator_methods
	(function ($)
	{
		// const regexp = /(?<tag>^[^\.# ]+)?(?<attr>[\.#]\S+)?/u;
		const regexp = /(?<tag>^[^\.# ]+)?((?<class>\.[^#\.]+)|(?<id>#[^\.]+))?/g;
		const regexTag = /^<.*>/ig;
		const regexID = /[\.\#]/g;
		const defaultSelector = '#layer';

		$.fn.extend(
		{
			create: function (selector)
			{
				// console.log(selector);
				if (!regexp.global)
					throw 'グローバルオプションが無効です.'

				const parent = $(this);

				if (parent.length == 0)
					return this;

				const defaultnode = $('<div />');

				if (selector == null)
					return defaultnode.appendTo(parent);

				// jqueryオブジェクトはそのまま追加
				if (selector instanceof jQuery)
				{
					if (selector.length == 0)
						return defaultnode.appendTo(parent);

					// 最後の要素をcloneして追加
					return selector.last().clone().appendTo(parent);
				}

				if (typeof selector !== 'string')
					return defaultnode.appendTo(parent);

				// htmltagの場合は追加して返す
				if (regexTag.test(selector))
					return $(selector).appendTo(parent);

				// セレクタをパース
				const nodes = selector.split(' ');

				let node = undefined;
				let first = true;
				for (let i = 0; i < nodes.length; i++)
				{
					if (nodes[i] === '')
						continue;

					const attributes = {};
					for (const match of nodes[i].matchAll(regexp))
					{
						for (const key in match.groups)
						{
							if (match.groups[key] === undefined) continue;
							if (key === 'class' && attributes[key]) attributes[key] = `${attributes[key]} ${match.groups[key]}`;
							else attributes[key] = match.groups[key];
						}
					}

					// console.log(attributes);
					// タグが有効なら採用、それ以外はDIV
					const tag = attributes.tag !== undefined && isEnableElement(attributes.tag) ? attributes.tag : 'div';
					
					// 最初は親に追加、以降はノードに追加
					node = $(`<${tag} />`).appendTo(first ? parent : node);
					if (attributes.id !== undefined) node.attr('id', attributes.id.replace(regexID, ''));
					if (attributes.class !== undefined) node.attr('class', attributes.class.replace(regexID, ''));
					first = false;
				}

				// console.log(first, node);
				// ノードが一度も追加されなかった場合はカラのdivを返す
				// それ以外は、追加したノードを返す
				return first ? defaultnode.appendTo(parent) : node;
			},
			href: function ()
			{
				const a = $(this).find('a');
				if (a.length == 0)
					return null;
				return a[0].href;
			},
			setcenter: function (parent, relative)
			{
				// const p = $(this);
				this.setcss(this.getcenter(parent, relative));
				return this;
			},
			getcenter: function (parent, relative)
			{
				// const p = $(this);
				const left = this.getCenterX(parent, relative);
				const top = this.getCenterY(parent, relative);
				if (relative === true)
				{
					return { 'margin-left': left, 'margin-top': top }
				}
				return { left: left, top: top };
			},
			setcenterH: function (parent, relative)
			{
				const p = $(this);
				const left = this.getCenterX(parent);
				if (relative === true)
				{
					this.setcss({ 'margin-left': left });
					return this;
				}
				this.setcss({ 'left': left });
				return this;
			},
			setcenterV: function (parent, relative)
			{
				// const p = $(this);
				const top = this.getCenterY(parent);
				if (relative === true)
				{
					this.setcss({ 'margin-top': top });
					return this;
				}
				this.setcss({ 'top': top });
				return this;
			},
			getCenterX: function (parent)
			{
				parent = parent ?? window;
				const parentWidth = $(parent).innerWidth();
				const childWidth = this.innerWidth();
				// const borderWidth = this.outerWidth(true) - this.outerWidth();
				return (((parentWidth - childWidth) / 2) / parentWidth * 100) + '%';
			},
			getCenterY: function (parent)
			{
				parent = parent ?? window;
				const parentHeight = $(parent).innerHeight();
				const childHeight = this.innerHeight();
				// const borderWidth = this.outerWidth(true) - this.outerWidth();
				return (((parentHeight - childHeight) / 2) / parentHeight * 100) + '%';
			},
			setcss: function (options)
			{
				// if (arguments.length == 0)
				if (options === undefined || options.length == 0 || arguments.length == 0)
					return this;

				options = arguments.length > 1 ? Array.from(arguments).slice(0, 2).join(':') : options;

				const css = parse(options);

				if (Object.keys(css).length == 0)
					return this;

				// console.log(this, css, options);
				this.css(css);
				return this;
			},
			getcss: function (detail = false)
			{
				const obj = detail ? this.prop('style') : this.attr('style');
				return parse(obj);
			},
			parsecss: function (css)
			{
				return parse(css);
			},
			debug: function ()
			{
				this.each(function ()
				{
					console.log($(this));
				})
			},
			drag: function ()
			{

			},
			filter: function (filter)
			{
				setfilter(this, filter);
				return this;
			},
			adjustWidth: function (parent)
			{
				parent = parent == undefined || parent == null || parent instanceof jQuery == false ? 'body' : parent;
				// bodyの幅を超えたら半分にする
				if (this.outerWidth() > $(parent).width())
					this.setcss({ width: '50vw' });
				return this;
			},
			invertAt: function (prop)
			{
				const propa = this.css(prop);
				if (propa !== undefined)
				{
					const regex = new RegexEx(/((?<item>\d+)(,\x20|\)))/g);
					const color = regex.getMatches(propa);
					if (regex.success)
					{
						const css = {};
						css[prop] = `rgb(${255 - color.item[0]}, ${255 - color.item[1]}, ${255 - color.item[2]})`;
						this.setcss(css);
					}
				}
				return this
			},
			invert: function ()
			{
				this.invertAt('background-color');
				this.invertAt('color');
				// const propb = this.css('background-color');
				// const propf = this.css('color');
				// const regex = new RegexEx(/((?<item>\d+)(,\x20|\)))/g);
				// const backgroundColor = regex.getMatches(propb);
				// const foreColor = regex.getMatches(propf);
				// if (regex.success)
				// {
				// 	const css = {};
				// 	css['background-color'] = `rgb(${255 - backgroundColor.item[0]}, ${255 - backgroundColor.item[1]}, ${255 - backgroundColor.item[2]})`;
				// 	css['color'] = `rgb(${255 - foreColor.item[0]}, ${255 - foreColor.item[1]}, ${255 - foreColor.item[2]})`;
				// 	console.log(css);
				// 	this.setcss(css);
				// }
				return this
			},
			createLayer: function (selector, modal = true, callback = null)
			{
				if ((selector instanceof jQuery) === false && typeof selector !== 'string')
				{
					return this;
				}

				// すでにある場合は返す
				if ($(defaultSelector).length > 0)
				{
					return $(defaultSelector);
				}

				const css = {
					'position'   : 'fixed',
					'left'       : '0',
					'top'        : '0',
					'width'      : '100%',
					'height'     :  $(document).height() + 'px',
					'white-space': 'nowrap',
					'opacity'    : '0.55',
					'overflow'   : 'hidden',
					'background' : '#000',
					'cursor'     : 'pointer',
				};

				const additionalCss = {
					'background-image'   : `url('/global/images/loading.svg?${Date.now()}')`,
					'background-repeat'  : 'no-repeat',
					'background-position': 'center calc(100vh / 2)',
				};

				let layer;

				// モーダル用のレイヤー
				if (modal)
				{
					window.addEventListener('resize', resizeHandler);
					scrolldeny(defaultSelector, true);

					// filterをかけるコンテナ(bodyにかけると全部ボケる)
					const container = $(this).children().first();
					container.setcss('filter: blur(10px)');

					layer = $(this).create(defaultSelector).setcss(css);

					// modalが有効な場合は、渡されたセレクタも削除対象
					const selectors = [defaultSelector, selector].join(', ');

					let functionCalled = false;
					// console.log(selectors);
					$(selectors).click(function (e)
					{
						window.removeEventListener('resize', resizeHandler);
						scrolldeny(defaultSelector, false);
						$(selectors).animate({ 'opacity': '0' }, 250, function ()
						{
							// console.log($(this));
							$(this).remove();
							container.setcss('filter: none');
							if (callback.handleEvent != null && typeof callback.handleEvent === 'function')
							{
								if (!functionCalled)
								{
									functionCalled = true;	
									callback.handleEvent(callback.obj);
								}
							}
						});
					});
				}
				// ajax通信のとき
				else
				{
					layer = $(this).create(selector).setcss(css).setcss(additionalCss);
				}

				return layer;
			},
			findById: function (search)
			{
				const nodes = $(this);
				for (let i = 0; i < nodes.length; i++)
				{
					const element = $(nodes[i]);
					if (element[0].id !== search)
						continue;
					return element;
				}
				return null;
			},
			where: function (predicate)
			{
				return _Iterator($(this), predicate, true);
			},
			selectBy: function (predicate)
			{
				return _Iterator($(this), predicate, false);
			},
		});

		function _Iterator($this, predicate, boolean)
		{
			if (typeof predicate !== 'function')
			{
				throw 'predicate is not function.';
			}

			const nodes = $this;
			const enumerable = [];
			for (let i = 0; i < nodes.length; i++)
			{
				const node = $(nodes[i]);
				const result = predicate(node);
				if (result === undefined || result === null || result === false)
					continue;
				enumerable.push(boolean ? node : result);
			}
			return $(enumerable);
		}

		const regexIntOrFloat = /^\d+(\.\d+)?$/;
		// const regexCss = /(?<prop>[\w\-]+)\s*:\s*(?<value>[^;]+);?/g;
		const regexCss = /(?<prop>[\w\-]+)\x20*:\x20*(?<value>[^;]+);?/g;
		function parse(options)
		{
			if (arguments.length == 0 || options === undefined || options.length == 0)
				return options;

			if (typeof options === 'object')
			{
				return objectParse(options);
			}

			if (!regexCss.global)
				throw 'グローバルオプションが無効です.'

			// コメントアウトに対応してみた...
			options = enableOptions(options);
			// console.log(options);

			const css = {};
			for (const match of options.matchAll(regexCss))
			{
				for (const key in match.groups)
				{
					if (match.groups[key] === undefined)
						continue;
					const prop = match.groups.prop.trim();
					const value = match.groups.value.trim();
					css[prop] = (regexIntOrFloat.test(value)) ? parseFloat(value) : value;
				}
			}

			// console.log(css);
			return css;
		}

		function enableOptions(options)
		{
			const Properties = [];
			const p = options.split(';');
			p.forEach(prop =>
			{
				const test = prop.trimStart();
				if (test.length == 0)
					return;
				if (!test.startsWith('//'))
				{
					// console.log(test);
					Properties.push(test);
				}
			});
			
			return Properties.join(';\n');
		}

		function objectParse(options)
		{
			const css = {};
			if (Object.keys(options).length == 0)
				return options;

			for (const key in options)
			{
				if (options[key] === undefined)
					continue;
				const prop = key;
				const value = options[key];
				css[prop] = value;
			}
			return css;
		}

		function isEnableElement(tag)
		{
			try
			{
				const el = document.createElement(tag);
				return el.constructor != HTMLUnknownElement;
			}
			catch (error)
			{
				return false;
			}
		}

		/* filter */
		let isFullScreen = false;
		let first = true;
		let currentfilter = {};
		function setfilter(obj, filter, fullscreen = false)
		{
			const key = filter.substr(0, 3);
			// const contains = currentfilter[key] !== undefined;
			// const contains = currentfilter.hasOwnProperty(key);
			const contains = key in currentfilter;

			if (contains && !fullscreen) delete currentfilter[key];
			else currentfilter[key] = filter;

			filter = Object.values(currentfilter).join(' ');

			if (first)
			{
				// 現在のCSSをキャッシュ
				// let style = parse(obj.attr('style'));
				first = false;
				obj.on('fullscreenchange webkitfullscreenchange mozfullscreenchange', function (e)
				{
					// if (document.fullscreenElement)
					// {
					// 	document
					// 		.exitFullscreen()
					// 		.then(() => {
					// 			if (isFullScreen)
					// 			{
					// 				// obj.setcss('position: static; width: 100%; height: 100%; top: 0; left: 0;');
					// 				style['position'] = 'static';
					// 				obj.setcss(style);
					// 				isFullScreen = false;
					// 			}
					// 			else
					// 			{
					// 				obj.setcss('position: fixed; width: 100%; height: 100%; top: 0; left: 0;');
					// 				isFullScreen = true;
					// 			}
					// 			// console.log("Document Exited from Full screen mode");
					// 		})
					// 		.catch((err) => console.error(err));
					// }
					// else
					// {
					// 	// document.documentElement.requestFullscreen();
					// 	console.log(document.documentElement)
					// }
					setfilter(obj, filter, true);
				});
			}

			// 監視用に属性を付ける
			obj.attr('data-filter', 'true');
			const timer = setInterval((e) =>
			{
				const o = $(document).find('[data-filter=true]');
				// console.log(o.length, o);
				if (o.length == 0)
				{
					clearInterval(timer);
					// 要素が削除されたら初期化
					currentfilter = {};
				}
			}, 300);

			obj.setcss(`filter: ${filter}`);

			return contains;
		}

		function deny(e)
		{
			// console.log(e);
			if ($(e.target).attr('id') == defaultSelector.replace('#', ''))
				e.preventDefault();
		}

		function scrolldeny(selector, reg = true)
		{
			if (selector == null)
				throw 'selector is null.';

			// console.log(selector);
			if (reg)
			{
				document.querySelector('body')?.addEventListener('mousewheel', deny, { passive: false });
				document.querySelector('body')?.addEventListener('touchmove', deny, { passive: false });
			}
			else
			{
				document.querySelector('body')?.removeEventListener('mousewheel', deny, { passive: false });
				document.querySelector('body')?.removeEventListener('touchmove', deny, { passive: false });
			}
		}

		function resizeHandler()
		{
			$(defaultSelector).height($(document).height());
		}

	})(jQuery);

	// const fadein = (selector) => {
	// 	const FADEIN_SECOND = 0.2;
	// 	const fadeinTarget = document.querySelector(selector);
	// 	fadeinTarget.style.transition = `all ${FADEIN_SECOND}s`;
	// 	fadeinTarget.style.opacity = 1;
	// };
	// const fadeout = (selector) => {
	// 	return new Promise((resolve) => {
	// 		const FADEOUT_SECOND = 0.1;
	// 		const fadeinTarget = document.querySelector(selector);
	// 		fadeinTarget.style.transition = `all ${FADEOUT_SECOND}s`;
	// 		fadeinTarget.style.opacity = 0;
	// 		setTimeout(() => {
	// 			resolve();
	// 		}, FADEOUT_SECOND * 1000);
	// 	});
	// };

