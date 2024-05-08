	'use strict';

	//window['Http'] = (function ()
	// window.Http = (function ()
	const Http = (function ()
	{
		let _isFileUpload, _progressCount,
			$this, _isProgress, _isFade, _scrollBody, jqxhr, _debug;

		function Http()
		{
			// this.domain      = location.host;
			// this.directory   = location.pathname.substring(0, location.pathname.lastIndexOf('/'));
			// this.pagename    = location.pathname.substring(location.pathname.lastIndexOf('/') + 1);
			this.url       = location.href;
			this.method    = 'GET';
			this.params    = null;

			$this          = this;
			_isFileUpload  = false;
			_progressCount = 0;
			_isProgress    = false;
			_isFade        = false;
			_scrollBody    = false;
			jqxhr          = null;
			_debug         = false;

			// 中止用キーイベント登録
			document.addEventListener('keydown', keyDownDelegate);
		}

		// const baseHost = location.origin;
		const baseHost = location.href;

		Http.Abort = () =>
		{
			if (jqxhr)
			{
				jqxhr.abort();
			}
		}

		Http.exists = function (url)
		{
			return new Http().head(url);
		}

		Http.prototype = {
			constructor: Http,

			settings: function (options)
			{
				if (typeof options !== 'object')
				{
					return this;
				}

				for (const key in options)
				{
					const value = options[key];
					switch (key)
					{
						case 'scrollBody':
							_scrollBody = value;
							break;
						case 'progress':
							_isProgress = value;
							break;
						case 'fade':
							_isFade = value;
							break;
						case 'upload':
							_isFileUpload = value;
							break;
						case 'debug':
							_debug = value;
							break;
						default:
							break;
					}
				}

				return this;
			},

			ajax: function (obj, func)
			{
				// if (jqxhr)
				// {
				// 	return jqxhr;
				// }

				if (_isFade && obj.length > 0)
				{
					obj.hide();
				}

				// console.log($.ajaxSettings);
				// httpで始まっていない場合は補完
				if (/^(https?|\/)/i.test(this.url) == false)
				{
					this.url = baseHost + this.url;
					console.log(this.url);
				}

				const XHR = $.ajaxSettings.xhr();

				const _xhr = function ()
				{
					// upload用イベント
					if (_isFileUpload)
					{
						XHR.upload.addEventListener('progress', handler_upload);
					}

					// ProgressEvent
					// readyStateイベント
					// 外に出すときはbindする
					XHR.addEventListener('readystatechange', handler_readystatechange.bind(obj));

					return XHR;
				}

				const settings = {
					url : this.url,
					type: this.method,
					xhr : _xhr,
					// timeout: 2000,
				}

				settings['data'] = this.params != null ? this.params : Date.now().toString();

				// ファイルアップロードのときは
				// contentType, processData = false
				if (_isFileUpload)
				{
					settings['contentType'] = false;
					settings['processData'] = false;
				}

				if (_debug)
				{
					console.log(settings);
				}

				jqxhr = $.ajax(settings)
				.done(async function (data, textStatus, jqXHR)
				{
					if (obj?.length > 0)
					{
						if (jqXHR.status == 200 || jqXHR.status == 304)
						{
							if (_isFade)
							{
								obj.fadeIn(1200);
							}

							if (jqXHR.responseJSON !== undefined)
							{
								obj.html(Object.values(data));
							}
							else
							{
								obj.html(data);
							}
						}
						else
						{
							obj.html(`読み込めません. (${jqXHR.status})`);
						}
					}

					if (func != null)
					{
						func(data, textStatus, jqXHR);
					}
				})
				.fail(function (data, textStatus, jqXHR)
				{
					if (data.status == 0)
					{
						new Toast().show('サーバーと通信出来ません.');
					}
					else
					{
						// new Toast().show(data.status);
					}
				})
				.always(function (data, textStatus, jqXHR)
				{
					document.removeEventListener('keydown', keyDownDelegate);
					XHR.upload.removeEventListener('progress', handler_upload);
					XHR.removeEventListener('readystatechange', handler_readystatechange);

					$('#loading').remove();

					Utility.TimerAction(() => $('#progress').animate({ opacity: 0 }, () => $('#progress').remove()), 3000);

					if (_debug)
					{
						console.log({ data: data, textStatus: textStatus, jqXHR: jqXHR });
					}
				});

				return jqxhr;
			},
			
			get: function (path, params, selector, func)
			{
				if (path != null && path != undefined)
				{
					this.url = path;
				}

				this.params = params;
				return this.ajax($(selector), func);
			},

			post: function (path, params, selector, func)
			{
				this.method = 'POST';

				if (path != null && path != undefined)
				{
					this.url = path;
				}

				this.params = params;
				return this.ajax($(selector), func);
			},

			head: function (path)
			{
				this.method = 'HEAD';
				if (path != null && path != undefined)
				{
					this.url = path;
				}
				return this.ajax();
			},

			abort: function (stop = false)
			{
				if (jqxhr == null)
				{
					console.log('process is stoped.')
					return;
				}

				!stop ? stop = confirm('will you stop process?') : stop;

				if (stop)
				{
					jqxhr.abort();
					// キーイベント解除
					document.removeEventListener('keydown', keyDownDelegate);
					NoticeDelegate('リクエストを中止しました.', 5000);
				}

				// console.log(jqxhr);
				jqxhr = null;
			},

			json: function (path, params, selector, func)
			{
				const obj = $(selector);

				if (_isFade)
				{
					obj.hide();
				}

				const callback = function (json, textStatus, jqXHR)
				{
					if (jqXHR.responseJSON == undefined)
					{
						try
						{
							json = JSON.parse(json);
						}
						catch
						{
							obj.html(json);
						}
					}

					// console.log(json);
					if (json === null)
						return;

					// console.log(json);

					// selectorがnullの場合は
					// funcを実行して終わり
					if (selector == null)
					{
						if (func != null)
							func(json);
						return;
					}

					$('#source, .navi, .processtime, .debug').remove();

					if (_isFade)
						obj.fadeIn(2000);

					if (json.logs !== undefined)
					{
						let sbx = new SelectBox();
						sbx.makeFromJson('#Date', json.logs);
					}

					if (json.time !== undefined)
						obj.create('.processtime').html(json.time);

					if (json.debug !== undefined)
						obj.create('.debug').html(json.debug);

					if (json.navi !== undefined)
						obj.create('.navi').html(json.navi);

					// sourceはHTMLコード
					if (json.source !== undefined)
						obj.create('#source').html(json.source);

					if (json.info !== undefined)
						NoticeDelegate(json.info);

					if (json.count !== undefined && json.count > 0)
						NoticeDelegate(json.count + '件取得しました.');

					if (func != null)
						func(json);
				}

				return this.get(path, params, null, callback);
			},

			upload: function (path, key, tmpFiles, selector, fade = false)
			{
				if (tmpFiles === null || tmpFiles == undefined || tmpFiles.length == 0)
				{
					return false;
				}

				_isFileUpload = true;

				const fd = new FormData();

				for (let i = 0; i < tmpFiles.length; i++)
				{
					fd.append(key, tmpFiles[i]);
				}

				return this.post(path, fd, selector);
			},
		};

		function NoticeDelegate(txt, sleep)
		{
			const toast = new Toast();
			if (sleep !== undefined)
			{
				toast.setSleep(2500);
			}
			toast.show(txt, 'top');
		}

		function keyDownDelegate(event)
		{
			if (event.keyCode == 27)
			{
				$this.abort(true);
			}
		}

		function handler_upload(e)
		{
			// プログレス用divを追加
			if ($('#progress').length == 0)
			{
				// $('#pv').setcss('font-size: 1.8em');

				const progressContainer = $('body')
					.create('#progress')
					.setcss(`
						width           : 100%;
						height          : 8px;
						position        : fixed;
						top             : 0;
						left            : 0;
						display         : block;
					`);

				progressContainer
					.create('<progress value="2" id="prog" max="100"></progress>')
					.setcss(`
						width           : 100%;
						border-radius   : 0;
						background-color: #1DA1F2;
					`);
			}

			const progress = parseInt(e.loaded / e.total * 100);
			console.log(progress);
			$('progress').val(progress);
		}

		function handler_readystatechange(e)
		{
			const XHR = e.target;
			const obj = $(this);

			switch (XHR.readyState)
			{
				// データ送信中.
				case 1:
					{
						if (_debug)
						{
							console.log(XHR.readyState + ') loading...' + XHR.responseText.length + ' bytes.');
						}

						if (_isProgress)
						{
							$('body').createLayer('#loading', false);
						}
						break;
					}
				// 応答待ち.
				case 2:
					{
						if (_debug)
						{
							console.log(XHR.readyState + ') loaded. ' + XHR.responseText.length + ' bytes.');
						}
						break;
					}
				// データ受信中.
				case 3:
					{
						if (_debug)
						{
							console.log(XHR.readyState + ') interactive... ' + XHR.responseText.length + ' bytes.');
						}

						_progressCount++;

						if (_isProgress)
						{
							// $('#progress').remove();
							$('#loading').remove();
						}

						obj.html(XHR.responseText);

						// Windowの高さを超えたら自動スクロール
						let isAutoScroll = obj != null ? obj != null : document.documentElement.scrollHeight > window.innerHeight;

						// if (_progressCount > 10 && document.documentElement.scrollHeight > window.innerHeight)
						if (_progressCount > 10 && isAutoScroll)
						{
							// if (_scrollBody) window.scroll(0, document.documentElement.scrollHeight);
							// else if (obj != null) obj.animate({ scrollTop: obj.outerHeight() }, 'slow', 'swing');
							// else window.scroll(0, document.documentElement.scrollHeight);
							window.scroll(0, document.documentElement.scrollHeight);
						}
						break;
					}
				default:
					{
						if (_debug)
						{
							console.log(XHR.readyState + ') ' + XHR.responseText.length + ' bytes.');
						}
					}
			}
		}

		// const fn = Http.prototype;

		return Http;
	})();

	const Utility = (function ()
	{
		function Utility()
		{

		}

		Utility.TimerAction = (func, sec) =>
		{
			const timer = setTimeout(() =>
			{
				clearTimeout(timer);
				func();
			}, sec);
		}

		return Utility;
	})();

	const TEST = (function ()
	{
		function TEST()
		{

		}

		return TEST;
	})();

