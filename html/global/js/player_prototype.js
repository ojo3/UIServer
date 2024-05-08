	// player_prototype.js

	'use strict';

	const VideoPlayer = (function ()
	{
		let isSlide            = false;
		let isClick            = false;
		let isMouseEnter       = false;
		let touchStartLocation = { x: 0, y: 0 };
		let expanded           = false;
		let now                = 0;
		let timer              = 0;
		// let isDurationChange = false;

		const isPc                = /Windows/i.test(window.navigator.userAgent);
		// const isiOS            = /ip(hone|ad|od)/i.test(window.navigator.userAgent);
		const clickTime           = 200;
		const fadeInDelay         = 100;
		const fadeOutDelay        = 800;
		const borderRadius        = 0;
		const playbackRateDefault = 1.0;
		const easing              = 'swing';
		const videoId             = 'player_';
		const videoPage           = `${location.origin}/view.video`;
		const ratio_width_pc      = 0.82;
		const ratio_width_sp      = 0.92;
		const windowRatio         = isPc ? ratio_width_pc : ratio_width_sp;

		const css = {
			window:
			{
				'position'        : 'fixed',
				'opacity'         : '0',
				'width'           : '50vw',
				'padding'         : '3px',
				'border'          : '2px solid #222',
				'outline'         : '0px solid transparent',
				'text-align'      : 'center',
				'background-color': '#222',
				'border-radius'   : `${borderRadius}px`,
			},
			inner:
			{
				'position'     : 'relative',
				'overflow'     : 'hidden',
				'border-radius': `${borderRadius}px`,
			},
			video:
			{
				'background-color': '#000',
				'margin'          : '0 auto',
				'display'         : 'block',
				'outline'         : '0 solid transparent',
				'width'           : '100%',
				'height'          : '100%',
				'object-fit'      : 'contain',
				'border-radius'   : `${borderRadius}px`,
			},
			caption:
			{
				'margin'          : '5px 0',
				'padding'         : '8px 4px',
				'background-color': '#393939',
				'border-radius'   : `${borderRadius / 2}px`,
			},
			button:
			{
				'display'         : 'inline-block',
				'position'        : 'absolute',
				'left'            : '0',
				'bottom'          : '0px',
				'width'           : '100%',
				'height'          : '28px',
				'cursor'          : 'pointer',
				'background-color': '#333',
			}
		}
		const filterButtons = { 'KeyG': '#gray', 'KeyC': '#contrast', 'KeyB': '#brightness' };
		const keyMap = {
			'Numpad0': 0, 'Numpad1': 5, 'Numpad2': 10, 'Numpad3': 15, 'Numpad4': 20,
			'Numpad5': 25, 'Numpad6': 30, 'Numpad7': 35, 'Numpad8': 40, 'Numpad9': 45,
		}

		function VideoPlayer()
		{
			MemoryMonitor.info(true);
			console.log(this);
		}

		VideoPlayer.initialize = function ()
		{
			(() => document.addEventListener('dblclick', fn.denyZoom, { passive: false }));
		}

		VideoPlayer.prototype = {
			constructor: VideoPlayer,
			name: 'VideoPlayer',
			create: function (host, source, parent)
			{
				if (host == null)
				{
					fn.error('host is null.');
					return;
				}

				if (source.length === 0)
				{
					fn.error('obj.length is 0.');
					return;
				}
				// console.log(this);

				fn.main({ host: host, source: source, parentNode: $(parent) });
			},
			error: function (message, clear = false)
			{
				if (clear) Toast.clear();
				new Toast().setAutoClose(true).show(message);
			},
			main: function (data)
			{
				let $obj = data;

				// console.log($obj);
				$obj.elements        = [];
				$obj.eventList       = [];

				$obj.layer           = null;
				$obj.container       = null;
				$obj.toggle          = null;
				$obj.menubutton      = null;
				$obj.relationItems   = null;
				$obj.filter          = null;
				$obj.seekbar         = null;

				$obj.videoId         = null;
				$obj.videoJQ         = null;
				$obj.visualizer      = null;
				$obj.coverJQ         = null;
				$obj.h4              = null;
				$obj.playList        = [];
				$obj.currentIndex    = 0;

				$obj.playState       = false;
				$obj.isRepeat        = false;
				$obj.playbackRate    = playbackRateDefault;
				$obj.hls             = null;
				$obj.clicked         = false;
				$obj.currentTime     = 0;
				$obj.totalDuration   = 0;
				$obj.seekSeconds     = isPc ? 1 : 0.45926;
				$obj.seekBarPosition = 0;
				$obj.isKeyDown       = false;
				$obj.windowSize      = { width: 0, height: 0 };
				$obj.videoSize       = { width: 0, height: 0 };

				$obj.guid            = $obj.source.attr('data-guid');
				$obj.img             = $obj.source.attr('data-thumb');
				$obj.fileName        = $obj.source.text();

				$obj.ext             = $obj.source.attr('data-ext');
				$obj.attr            = $obj.source.attr('data-duration');
				$obj.duration        = $obj.attr != null ? parseFloat($obj.attr) : 0;
				// $obj.isVideo         = $obj.ext === '.mp4';
				$obj.isVideo         = $obj.ext != '.mp3' & $obj.ext != '.wav' & $obj.ext != '.aac';
				$obj.expanded        = !$obj.isVideo;

				/* パーツ生成 */
				$obj.baseColor = $('a').css('color');

				$obj.layer = $('body').createLayer('.window', true, { handleEvent: fn.closeEvent, obj: $obj });

				css.window['box-shadow'] = `0px 0px ${borderRadius}px 0px ${$obj.baseColor}`;
				$obj.container = $('body').create(`.window#${Date.now()}`).setcss(css.window);

				// iOS対策として、絶対位置(absolute, fixed)指定とoverflow属性のコンテナは分離する
				const inner = $obj.container.create('.outer').setcss(css.inner).setcss('width: 100%; height: 100%;');
				const videoinner = inner.create('.inner').setcss(css.inner).setcss('position: relative;');

				// ▼ 順番は変更したらダメ
				$obj.videoJQ = videoinner.create('<video>').setcss(css.video).prop({ 'muted': true });

				/* visualizer */
				$obj.visualizer = videoinner.create('canvas#visualizer').setcss(`
					position: absolute;
					top: 0;
					left: 0;
					display: block;
					width: 100%;
					height: 100%;
					opacity: 1;
					mix-blend-mode: screen;
				`);

				/* cover */
				$obj.coverJQ = videoinner.create('#cover').setcss(`
					opacity: 0;
					position: absolute;
					top: 0;
					left: 0;
					color: #fff;
					text-align: center;
					width: calc(100%);
					height: calc(100%);
				`);

				$obj.h4 = $obj.coverJQ.create('h4').setcss(`
					margin-top: 8px;
					display: inline-block;
					padding: 8px;
					background: rgba(0, 0, 0, 0.5);
					border-radius: 16px;
				`).text($obj.fileName);

				$obj.time = $obj.coverJQ.create('.time').setcss(`
					display: inline-block;
					position: absolute;
					bottom: 12%;
					padding: 8px;
					background: rgba(0, 0, 0, 0.5);
					border-radius: 16px;
				`).text('00:00 / 00:00');
				$obj.time.setcenterH($obj.coverJQ);

				// ctrl
				$obj.ctrls = $obj.coverJQ.create('#ctrls').setcss(`
					position: absolute;
					bottom: 18px;
					left: 0;
					width: 100%;
				`);

				$obj.seekbar = $obj.ctrls.create('input#seekbar').prop({ 'type': 'range', 'value': 0 }).setcss(`
					cursor: pointer;
					display: block;
					width: 92%;
					margin: 0 auto;
				`);
				$obj.seekbar.on('input', (e) => $obj.videoJQ[0].currentTime = e.target.value);

				$obj.toggle = inner.create('.toggleArea').setcss('display: none');

				$obj.menubutton = inner.create('a#expandmenu').setcss(css.button);
				const accentcss = `margin: 22px auto; width: 35px; height: 6px; background-color: ${$obj.baseColor};`;
				const bar = $obj.menubutton.create().setcss(accentcss);
				bar.create().setcss(accentcss).setcss('filter: blur(4px); mix-blend-mode: hard-light;');

				$obj.menubutton.click((e) =>
				{
					e.preventDefault();
					
					$obj.toggle.toggle();
					fn.resize($obj);

					const state = { expanded: expanded };
					history.pushState(state, null, null);
					// console.log(expanded, state, history.state);
					fn.scrollToItem($obj);
					return false;
				});

				$obj.toggleButtonHeight = parseInt(css.button['height']) + 5;

				$obj.container.setcenter();
				$obj.container.animate({ 'opacity': '1' }, fadeInDelay, easing, () =>
				{
					fn.videoRequest($obj, true);
				});

				$obj.elements.push($obj.layer);
				$obj.elements.push($obj.container);

				return $obj.videoJQ;
			},
			scrollToItem: function ($obj)
			{
				const timer = setTimeout(() =>
				{
					clearTimeout(timer);

					const parent = $obj.relationItems;
					const active = parent.find('li').where(e => e.attr('data-guid') == $obj.guid);

					if (active.length == 0)
						return;

					const position = (active[0][0].offsetTop > parent[0].offsetTop)
						? Math.round(active[0][0].offsetTop - parent[0].offsetTop - (parent[0].clientHeight / 2))
						: Math.round(parent[0].scrollTop - active[0][0].offsetTop);

					if (position > 0)
					{
						// console.log(active[0][0].offsetTop, parent[0].scrollTop, parent[0].offsetTop, active[0]);
						parent.stop(true, true).animate({ scrollTop: position + (active[0][0].clientHeight / 2) }, fadeOutDelay)
					}
				}, fadeOutDelay);
			},
			videoRequest: function ($obj, append)
			{
				if ($obj.guid == null || $obj.img == null)
				{
					fn.error('videoRequest failed.');
					return;
				}

				new Http().settings({ progress: false })
				.get(`${videoPage}`, $obj.guid).done(function (data)
				{
					fn.videoLoad($obj, append);

					$obj.h4.text($obj.fileName);

					if (append)
					{
						fn.appendRelationItems($obj, data);
					}
				})
				.fail(function (data, textStatus, jqXHR)
				{
					const t = new Toast();
					console.log(data);
					const test = $(data.responseText).findById('container');
					if (test != null)
					{
						// console.log(test);
						t.setAutoClose(false).show(test.find('p').text(), null, () =>
						{
							fn.closeEvent($obj);
						});
					}
					else
					{
						fn.closeEvent($obj);
					}
				});
			},
			appendRelationItems: function ($obj, data)
			{
				// ダウンロードデータから要素を再構成
				const nodes = $(data).find('.relation');

				if (nodes.length == 0)
				{
					fn.error('nodes length is 0');
					return;
				}

				nodes.find('h3').remove();
				$obj.relationItems = nodes.find('.scroll').setcss('max-height: none');
				fn.selectedItemToggle($obj);

				const relation = $obj.toggle.create().html(nodes);
				// すべて可視
				relation.find('*').each(function () { $(this).show() });
				
				const child = nodes.find('a');

				// 音声ファイルのみ自動再生
				if (!$obj.isVideo)
				{
					child.each(function ()
					{
						const a = $(this);
						$obj.playList.push({ guid: a.attr('data-guid'), thumb: a.attr('data-thumb'), text: a.text() });
					});
					$obj.currentIndex = fn.getCurrentIndex($obj);
				}

				child.click(function (e)
				{
					// SoundVisualizer.stop();
					e.preventDefault();
					const a = $(this);
					// 停止フラグ！！！！
					$obj.playState = false;
					$obj.guid = a.attr('data-guid');
					$obj.img  = a.attr('data-thumb');
					$obj.fileName = a.text();
					if (!$obj.isVideo)
						$obj.currentIndex = fn.getCurrentIndex($obj);
					fn.selectedItemToggle($obj);
					fn.videoRequest($obj, false);
					return false;
				});
			},
			selectedItemToggle: function ($obj)
			{
				if ($obj.relationItems == null || $obj.relationItems.length == 0)
					return;
				const li = $obj.relationItems.find('li');
				li.each(function () { $(this).removeClass('active'); });
				const active = li.where(e => e.attr('data-guid') == $obj.guid);
				active[0].addClass('active');
			},
			getCurrentIndex: function ($obj)
			{
				if ($obj == null)
					return -1;

				for (let i = 0; i < $obj.playList.length; i++)
				{
					if ($obj.playList[i].guid == $obj.guid)
					{
						return i;
					}
				}
				return -1;
			},
			videoLoad: function ($obj, append = false)
			{
				let isLoad = false;
				// isLoad = true;
				if (!isLoad)
				{
					Socket.connect(`${$obj.host}`, $obj.guid, (message) =>
					{
						if (message != null)
						{
							if (message.data === $obj.guid)
							{
								isLoad = true;
							}
							else
							{
								new Toast().show(message.data, 'top');
							}
						}
					});
				}

				const videoSrc = `/ts/${$obj.guid}/video.m3u8`;

				$obj.videoId = videoId + $obj.guid;
				$obj.videoJQ = $obj.videoJQ.prop({ 'id': $obj.videoId });

				if ($obj.isVideo)
				{
					$obj.videoJQ.prop({ 'poster': $obj.img });
				}

				if (append)
				{
					fn.loadControls($obj);
					fn.initializeEvent($obj);
				}

				if ($obj.hls != null)
					$obj.hls.destroy();

				if (Hls.isSupported())
				{
					// 自動再生はメディアポリシー？的に不可らしいが、
					// 100ms後にfalseにしてやったら自動再生ぽくなったぜ.
					const timer = setInterval(() =>
					{
						if (!isLoad)
							return;

						clearTimeout(timer);
						fn.videoLoad_Internal($obj, videoSrc);
					}, fadeInDelay);
				}
				else if ($obj.videoJQ[0].canPlayType('application/vnd.apple.mpegurl'))
				{
					$obj.videoJQ[0].src = videoSrc;
				}
			},
			videoLoad_Internal: function ($obj, videoSrc)
			{
				if ($obj.videoJQ == null)
				{
					fn.error('videoLoad_Internal failed.');
					return;
				}

				$obj.hls = new Hls();
				$obj.hls.loadSource(videoSrc);
				$obj.hls.attachMedia($obj.videoJQ[0]);
				$obj.container.setcenter();
				$obj.hls.on(Hls.Events.MEDIA_ATTACHED, () =>
				{
					const result = $obj.videoJQ[0].play();
					$obj.videoJQ[0].muted = false;

					if (result)
					{
						result.then(() =>
						{
							$obj.playState = true;
							// 2秒ぐらいの誤差は0にする
							if (Math.floor($obj.duration) < Math.floor($obj.totalDuration) - 2)
								$obj.videoJQ[0].currentTime = $obj.duration;
							else $obj.videoJQ[0].currentTime = 0;
						})
						.catch((ex) =>
						{
							$obj.playState = false;
							$obj.videoJQ[0].pause();
							// new Toast().setAutoClose(false).show('再生出来ません.');
							// new Toast().show('再生出来ません.');
							console.log(ex);
						})
						.finally(() =>
						{
							// historyバックを無効にするため、nullの履歴を追加
							history.pushState({ expanded: expanded }, null, null);

							// seek bar position detected.
							$obj.seekBarPosition = $obj.videoJQ.offset().top + $obj.videoJQ.height() - 10;

							if ($obj.expanded)
								$obj.toggle.show();

							fn.resize($obj);

							// 音声ファイルであればビジュアライザを起動
							if (!$obj.isVideo)
							{
								$obj.coverJQ.animate({ opacity: 1 }, fadeInDelay);
								fn.scrollToItem($obj);
								SoundVisualizer.start();
							}
						});
					}

					return false;
				});
			},
			loadControls: function ($obj)
			{
				if ($obj.isVideo)
				{
					$obj.filter = $obj.toggle.create('.filter').setcss('margin: 10px 0; padding: 5px');
					CustomButton.create($obj.filter, filterButtons['KeyG'], 'G').filter('grayscale()', $obj.videoJQ[0]);
					CustomButton.create($obj.filter, filterButtons['KeyC'], 'C').filter('contrast(128%)', $obj.videoJQ[0]);
					CustomButton.create($obj.filter, filterButtons['KeyB'], 'B').filter('brightness(1.28)', $obj.videoJQ[0]);
					$(filterButtons['KeyC']).setcss('margin: 0 10%');
					// $obj.elements.push($obj.filter);
				}
			},
			play: function ($obj)
			{
				if ($obj.playState)
				{
					$obj.videoJQ[0].pause();
				}
				else
				{
					$obj.videoJQ[0].play();
				}
				$obj.playState = !$obj.playState;

			},
			seek: function ($obj, key)
			{
				// if (isDurationChange)
				// 	return;

				switch (key)
				{
					case 'ArrowRight':
						if ($obj.currentTime + $obj.seekSeconds < $obj.totalDuration)
							$obj.currentTime += $obj.seekSeconds;
						$obj.videoJQ[0].currentTime = $obj.currentTime;
						break;
					case 'ArrowLeft':
						if ($obj.currentTime - $obj.seekSeconds > 0)
							$obj.currentTime -= $obj.seekSeconds;
						$obj.videoJQ[0].currentTime = $obj.currentTime;
						break;
					default:
						break;
				}

				$obj.seekbar[0].value = $obj.currentTime;

				if (timer > 0)
				{
					clearTimeout(timer);
					timer = 0;
				}

				if ($obj.playState)
					$obj.coverJQ.stop().animate({ opacity: 1 }, fadeInDelay);

				fn.timeprogress($obj);
			},
			timeprogress: function ($obj)
			{
				$obj.time.text(`${fn.convertTime($obj.videoJQ[0].currentTime)} / ${fn.convertTime($obj.totalDuration)}`);
			},
			resize: function (obj)
			{
				const $obj = obj.guid != null ? obj : this;

				// 関連動画非表示の場合
				const hidden = $obj.toggle.css('display') == 'none';
				$obj.expanded = !hidden;

				$obj.windowSize.width = window.innerWidth;
				$obj.windowSize.height = window.innerHeight;

				const isContains = ($obj.videoJQ[0]?.videoWidth < $obj.windowSize.width && $obj.videoJQ[0]?.videoHeight < $obj.windowSize.height);

				const containerSize = {
					width: $obj.windowSize.width * windowRatio,
					height: $obj.windowSize.height * windowRatio
				};

				// ビデオファイルの場合、
				// オーディオファイル時の初回、
				// ウィンドウ幅を超えた場合に調整
				if ($obj.isVideo || $obj.videoSize.width == 0 || $obj.videoSize.width > containerSize.width)
				{
					$obj.container.setcss(`width: ${containerSize.width + 5}`);
					// $obj.videoJQ.setcss(`width: ${containerSize.width}`);
				}

				// オーディオ用
				if ($obj.videoSize.width == 0)
				{
					$obj.videoSize.width = containerSize.width;
					$obj.videoSize.height = containerSize.width * 9 / 16;
				}

				// リスト非表示の場合
				if (hidden)
				{
					// video の場合は、widthにアスペクト比を乗算してheightを計算
					// audio の場合は、videoSize.height => container.height()を参照
					// width を 1 とした場合の heigth の ratio
					const videoRatio = ($obj.videoJQ[0]?.videoHeight / $obj.videoJQ[0]?.videoWidth);
					containerSize.height = $obj.isVideo ? containerSize.width * videoRatio : $obj.videoSize.height;
				}
				else
				{
					containerSize.height = $obj.windowSize.height * windowRatio;
				}

				// 高さが window高を超えた場合は、パーセンテージを合わせる
				if (containerSize.height + $obj.toggleButtonHeight > $obj.windowSize.height * windowRatio)
				{
					containerSize.height = $obj.windowSize.height * windowRatio;
				}

				$obj.container.setcss(`height: ${containerSize.height + $obj.toggleButtonHeight}`);

				const videoHeight = hidden ? containerSize.height : containerSize.height * 0.5; 
				$obj.videoJQ.setcss(`height: ${videoHeight}`);

				const add = $obj.isVideo ? $obj.toggleButtonHeight + ($obj.filter?.outerHeight(true) / 2) : 0;
				$obj.relationItems.setcss(`height: ${containerSize.height - (videoHeight + add) - 3}`);

				$obj.container.setcenter();
				$obj.time.setcenterH($obj.coverJQ);
				// $obj.visualizer.setcenter($obj.coverJQ);
			},
			/* events */
			getEventList: function ($obj)
			{
				return [
					{ target: window,          type: 'popstate',       handler: fn.popstate.bind($obj) },
					{ target: window,          type: 'resize',         handler: fn.resize.bind($obj) },
					{ target: document,        type: 'keydown',        handler: fn.keydown.bind($obj) },
					{ target: document,        type: 'keyup',          handler: fn.keyup.bind($obj) },
					{ target: $obj.videoJQ[0], type: 'durationchange', handler: fn.durationchange.bind($obj) },
					{ target: $obj.videoJQ[0], type: 'timeupdate',     handler: fn.timeupdate.bind($obj) },
					{ target: $obj.videoJQ[0], type: 'ended',          handler: fn.ended.bind($obj) },
					{ target: $obj.videoJQ[0], type: 'loadedmetadata', handler: fn.loadedmetadata.bind($obj) },
					{ target: $obj.coverJQ[0], type: 'mouseenter',     handler: fn.mouseenter.bind($obj) },
					{ target: $obj.coverJQ[0], type: 'mouseleave',     handler: fn.mouseleave.bind($obj) },
					{ target: $obj.coverJQ[0], type: 'mousemove',      handler: fn.mousemove.bind($obj) },
					{ target: $obj.coverJQ[0], type: 'click',          handler: fn.click.bind($obj) },
					{ target: $obj.coverJQ[0], type: 'wheel',          handler: fn.wheel.bind($obj) },
					{ target: $obj.coverJQ[0], type: 'touchstart',     handler: fn.touchstart.bind($obj) },
					{ target: $obj.coverJQ[0], type: 'touchend',       handler: fn.touchend.bind($obj) },
					{ target: $obj.coverJQ[0], type: 'touchmove',      handler: fn.touchmove.bind($obj) },
				];
			},
			initializeEvent: function ($obj)
			{
				$obj.eventList = fn.getEventList($obj);
				for (let i = 0; i < $obj.eventList.length; i++)
				{
					($obj.eventList[i].target).addEventListener($obj.eventList[i].type, $obj.eventList[i].handler);
				}
			},
			destroyEvent: function ($obj)
			{
				for (let i = 0; i < $obj.eventList.length; i++)
				{
					($obj.eventList[i].target).removeEventListener($obj.eventList[i].type, $obj.eventList[i].handler);
				}
			},
			touchstart: function (e)
			{
				this.coverJQ.stop().animate({ opacity: 1 }, fadeInDelay);
				if (fn.isTouchSeekBar(e))
					return;
				// default event が反応起動する
				e.preventDefault();
				const touch = e.touches[0];
				touchStartLocation.x = touch.pageX;
				touchStartLocation.y = touch.pageY;
				now = Date.now();
			},
			touchmove: function (e)
			{
				if (fn.isTouchSeekBar(e))
					return;
				fn.touchProccess(e, this);
			},
			touchend: function (e)
			{
				e.preventDefault();
				if (!isSlide && Date.now() - now < clickTime)
					fn.play(this);
				if (this.isVideo && this.playState)
					this.coverJQ.stop(true, true).animate({ opacity: 0 }, fadeOutDelay);
				touchStartLocation = { x: 0, y: 0 };
				isSlide = false;
			},
			touchProccess: function (e, $obj)
			{
				const touch = e.touches[0];
				let diff = (touchStartLocation.x - touch.pageX) * -1;

				if (diff > 0 && toFloor($obj.videoJQ[0].currentTime, 0) == 0)
					return;

				if (Math.abs(diff) < 5)
					return;
				
				// $('#debug').html(`screen touch => ${toFloor(touch.pageY)}`);
				isSlide = true;
				e.preventDefault();
				$obj.videoJQ[0].pause();
				fn.seek($obj, diff < 0 ? 'ArrowLeft' : 'ArrowRight');
			},
			click: function (e)
			{
				// フォーカスを外さないと、
				// documentのイベントが拾えない.
				this.videoJQ[0].blur();

				if (fn.isTouchSeekBar(e))
				{
					return;
				}

				if (isClick)
				{
					const diff = Date.now() - now;
					if (diff < 300)
					{
						isClick = false;
						console.log('double click');
						now = 0;
						return true;
					}
				}

				isClick = true;
				now = Date.now();
				const timer = setTimeout(() =>
				{
					clearTimeout(timer);
					if (isClick)
					{
						// console.log('click', Date.now() - now);
						fn.play(this);
					}
				}, 310);
				return false;
			},
			popstate: function (e)
			{
				e.preventDefault();
				// const state = e.state;
				// console.log(state);
				// if (state?.expanded)
				if (this.expanded)
				{
					this.toggle.toggle();
					fn.resize(this);
					return false;
				}

				if (!this.isVideo && !confirm('閉じますか？'))
					return;

				fn.closeEvent(this);
				return false;
			},
			keydown: function (e)
			{
				// this の中身は、bind したオブジェクト
				if (this.videoJQ == null)
					return;

				if (this.isVideo && !this.isKeyDown)
					this.coverJQ.stop().animate({ opacity: 1 }, fadeInDelay);

				switch (e.code)
				{
					case 'Escape':
						fn.closeEvent(this);
						break;
					case 'Space':
						e.preventDefault();
						fn.play(this);
						break;
					case 'Backspace':
						this.videoJQ[0].currentTime = 0;
						break;
					case 'PageUp':
					case 'PageDown':
						e.preventDefault();
						const cursor = e.code == 'PageUp' ? 'prev' : 'next';
						fn.movePlayList(this, cursor);
						break;
					case 'ArrowRight':
					case 'ArrowLeft':
						this.isKeyDown = true;
						this.videoJQ[0].pause();
						fn.seek(this, e.code);
						break;
					case 'ArrowUp':
					case 'ArrowDown':
					case 'Home':
						e.preventDefault();
						const buffer = this.playbackRate;
						if (e.code == 'ArrowUp')
						{
							if (this.playbackRate + 0.1 <= 1.5)
								this.playbackRate += 0.1;
						}
						else if (e.code == 'ArrowDown')
						{
							if (this.playbackRate - 0.1 >= 0.6)
								this.playbackRate -= 0.1;
						}
						else
						{
							this.playbackRate = 1.0;
						}
						if (buffer != this.playbackRate)
						{
							this.videoJQ[0].playbackRate = fn.toFloor(this.playbackRate, 2);
							fn.error(`${this.videoJQ[0].playbackRate} 倍速`, true);
						}
						break;
					case 'KeyG':
					case 'KeyC':
					case 'KeyB':
						$(filterButtons[e.code]).click();
						break;
					case 'KeyM':
						this.videoJQ[0].muted = !this.videoJQ[0].muted;
						break;
					case 'KeyR':
						this.isRepeat = !this.isRepeat;
						const mess = this.isRepeat ? 'ON' : 'OFF';
						Toast.clear();
						fn.error(`リピート ${mess}`);
						break;
					case 'Numpad0':
					case 'Numpad1':
					case 'Numpad2':
					case 'Numpad3':
					case 'Numpad4':
					case 'Numpad5':
					case 'Numpad6':
					case 'Numpad7':
					case 'Numpad8':
					case 'Numpad9':
						this.currentTime = keyMap[e.code];
						this.videoJQ[0].currentTime = this.currentTime;
						break;
					default:
						break;
				}
				// console.log(e);
			},
			keyup: function (e)
			{
				// console.log(this.isKeyDown, e.code);
				// 1: Queue discard 2:Jump LastFrames
				if (this.isVideo && this.playState && !isMouseEnter)
					this.coverJQ.stop(true, true).animate({ opacity: 0 }, fadeOutDelay);

				// e.preventDefault();
				this.isKeyDown = false;
				if (e.code != 'Space' && this.playState)
				{
					this.videoJQ[0].play();
				}
			},
			// Numキーにマッピング
			// 再生時間が更新されるたびに呼ばれる.
			durationchange: function (e)
			{
				this.totalDuration = this.videoJQ[0].duration;
				this.seekbar[0].max = this.totalDuration;
				const par = Math.round(this.totalDuration / 10);
				let i = 0;
				for (const key in keyMap)
				{
					keyMap[key] = par * i;
					i++;
				}
				// isDurationChange = true;
			},
			timeupdate: function (e)
			{
				// キーを押していない場合に実行
				if (!this.isKeyDown)
				{
					this.currentTime = this.videoJQ[0].currentTime;
					this.seekbar[0].value = this.currentTime;
					fn.timeprogress(this);
				}
			},
			ended: function ()
			{
				if (!this.playState)
				{
					return;
				}

				this.playState = false;

				if (this.isRepeat)
				{
					this.videoJQ[0].currentTime = 0;
					fn.play(this);
				}
				else
				{
					if (this.isVideo)
					{
						SoundVisualizer.disconnect();
					}
					else
					{
						fn.movePlayList(this, 'next');
					}
				}
			},
			movePlayList: function ($obj, cursor)
			{
				if ($obj.playList.length == 0)
				{
					return;
				}
				if ($obj.currentIndex + 1 < $obj.playList || $obj.currentIndex - 1 >= 0)
				{
					$obj.currentIndex += cursor == 'prev' ? -1 : 1;
					const next = $obj.playList[$obj.currentIndex];
					$obj.guid = next.guid;
					$obj.img = next.thumb;
					$obj.fileName = next.text;
					fn.videoRequest($obj, false);
					fn.selectedItemToggle($obj);
				}
			},
			loadedmetadata: function (e)
			{
				// console.log(e);
			},
			wheel: function (e)
			{
				e.preventDefault();
				if (this.isVideo)
					this.coverJQ.stop().animate({ opacity: 1 });
				fn.seek(this, e.deltaY / 100 < 0 ? 'ArrowRight' : 'ArrowLeft');
			},
			mouseenter: function ()
			{
				isMouseEnter = true;
				if (this.playState)
					this.coverJQ.stop().animate({ opacity: 1 }, fadeInDelay);
			},
			mouseleave: function ()
			{
				isMouseEnter = false;
				// 1: Queue discard 2:Jump LastFrames
				if (this.isVideo && this.playState)
					this.coverJQ.stop(true, true).animate({ opacity: 0 }, fadeOutDelay);
			},
			mousemove: function ()
			{
				if (isMouseEnter)
				{
					this.coverJQ.setcss({ opacity: 1 });
				}
			},
			closeEvent: function ($obj)
			{
				MemoryMonitor.info(true);

				SoundVisualizer.disconnect();

				if ($obj == null)
				{
					return;
				}

				fn.destroyEvent($obj);

				// 再生ポイントをストック
				$obj.source?.attr('data-duration', $obj.currentTime);
				$obj.hls?.destroy();
				$obj.container.animate({ 'opacity': '0' }, fadeInDelay, easing, () =>
				{
					$obj.parentNode.setcss('filter: none');
					$obj.elements?.forEach(element =>
					{
						element.remove();
					});

					for (const key in $obj)
					{
						$obj[key] = null;
					}

					$obj = null;

					// Toast.clear();
				});

				return false;
			},
			enabledFullScreen: function ()
			{
				return (document.fullscreenEnabled || document.mozFullScreenEnabled || document.documentElement.webkitRequestFullScreen || document.msFullscreenEnabled);
			},
			denyZoom: function (e)
			{
				e.preventDefault();
			},
			isTouchSeekBar: function (e)
			{
				console.log(e.target.id);
				return e.target.id == 'seekbar';
			},
			convertTime: function (sec)
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
			},
			toFloor: function (num, digit = 2)
			{
				const pow = Math.pow(10, digit);
				return digit == 0 ? Math.floor(num) : Math.floor(num * pow) / pow;
			}
		}

		const fn = VideoPlayer.prototype;

		return VideoPlayer;
	})();

	// $(() =>
	// {
	// 	if (!isPc)
	// 	{
	// 		const debug = $('body').create('#debug')
	// 			.setcss(`
	// 				z-index: 9;
	// 				position: fixed;
	// 				top: 0;
	// 				left: 0;
	// 				padding: 5px;
	// 				background-color: rgba(255, 0, 0, 0.8);
	// 				width: calc(100% - 10px);`)
	// 			.text(`${window.screen.width} : ${window.screen.height}`)
	// 			.click(() => 	debug.animate({ 'opacity': 0 }, () =>
	// 			{
	// 				debug.remove();
	// 			}));
	// 	}
	// });	

	// $(() =>
	// {
	// 	setTimeout(async () =>
	// 	{
	// 		let vp = new VideoPlayer();
	// 		const player = vp.create('http://192.168.11.10:5925', $('#slippylist > div:nth-child(4) > p > a'), '#container');
	// 	}, 500);
	// });

	VideoPlayer.initialize();

	const SoundVisualizer = (function ()
	{
		const hueMax          = 220;
		const hueMin          = 170;
		// const hueMax          = 360;
		// const hueMin          = 0;
		// 色相の変化速度（小さい値ほど遅くなります）
		const hueIncrement    = 0.1;
		const marginIncrement = 1;
		const blockWidth      = 2;
		const lightness       = 50;

		// 色相の初期値
		let hue          = hueMin;
		let animateID    = 0;
		let audioContext = null;
		let analyser     = null;
		let videoSource  = null;
		let visualType   = 'bar';

		function SoundVisualizer(type = 'bar')
		{
			if (audioContext != null || videoSource != null)
			{
				return;
			}

			// オーディオ要素とコンテキストを取得
			const videoElement = document.querySelector('video');

			if (videoElement == null)
				return;

			visualType = type;

			// オーディオコンテキストを作成
			audioContext = new (window.AudioContext || window.webkitAudioContext)();
			videoSource = audioContext.createMediaElementSource(videoElement);

			// 分析用のAnalyserノードを作成
			this.analyser = audioContext.createAnalyser();
			this.analyser.fftSize = 2048;
			analyser = this.analyser;

			// オーディオ要素をAnalyserノードに接続
			videoSource.connect(this.analyser);
			videoSource.connect(audioContext.destination);

			this.canvas = document.getElementById('visualizer');
			this.canvasContext = this.canvas.getContext('2d');

			// this.videoElement.addEventListener('play', (() =>
			// {
			// 	this.isPlay = true;
			// 	// animateID = window.requestAnimationFrame(drawBlocks.bind(this));
			// }).bind(this));

			// this.videoElement.addEventListener('pause', (() =>
			// {
			// 	this.isPlay = false;
			// }).bind(this));

			// this.videoElement.addEventListener('ended', () =>
			// {
			// 	SoundVisualizer.disconnect();
			// });
		}

		SoundVisualizer.prototype = {
			constructor: SoundVisualizer,
			name: 'SoundVisualizer'
		}

		SoundVisualizer.start = function ()
		{
			const instance = new SoundVisualizer();
			if (visualType === 'wave')
			{
				drawWaveform(instance);
			}
			else
			{
				drawBlocks(instance);
				// drawCircle(instance);
			}
		}

		SoundVisualizer.disconnect = function ()
		{
			window.cancelAnimationFrame(animateID);
			videoSource?.disconnect();
			videoSource = null;
			analyser?.disconnect();
			analyser = null;
			audioContext?.close();
			audioContext = null;
			hue = hueMin;
		}

		// 波形の描画
		function drawWaveform($this)
		{
			$this = this ?? $this;

			if (this == null && $this == null)
				return;

			if ($this.analyser == null)
			{
				return;
			}
	
			// Analyserノードから波形データを取得
			const bufferLength = $this.analyser.fftSize;

			const dataArray = new Uint8Array(bufferLength);
			$this.analyser.getByteTimeDomainData(dataArray);

			// キャンバスをクリア
			$this.canvasContext.clearRect(0, 0, $this.canvas.width, $this.canvas.height);

			// 波形を描画
			$this.canvasContext.lineWidth = 2;

			// 色相を更新
			// hue = (hue + hueIncrement) % 360;
			if (hue + hueIncrement > hueMax)
			{
				turnBack =  true;
				console.log('hue--', hue);
			}
			else if (hue - hueIncrement < hueMin)
			{
				turnBack = false;
				console.log('hue++', hue);
			}
			hue = turnBack ? (hue - hueIncrement) % 360 : (hue + hueIncrement) % 360;

			$this.canvasContext.strokeStyle = `hsl(${hue}, 100%, 50%, 0.5)`;

			$this.canvasContext.beginPath();

			const sliceWidth = $this.canvas.width * 1.0 / bufferLength;
			let x = 0;

			for (let i = 0; i < bufferLength; i++)
			{
				const v = dataArray[i] / 128.0;
				const y = v * $this.canvas.height / 2;

				if (i === 0)
				{
					$this.canvasContext.moveTo(x, y);
				}
				else
				{
					$this.canvasContext.lineTo(x, y);
				}

				x += sliceWidth;
			}

			$this.canvasContext.lineTo($this.canvas.width, $this.canvas.height / 2);
			$this.canvasContext.stroke();

			// 次のフレームで再描画
			window.requestAnimationFrame(drawWaveform.bind($this));
		}

		function drawCircle($this)
		{
			$this = this ?? $this;

			if (this == null && $this == null)
				return;

			if ($this.analyser == null)
				return;

			const dataArray = new Uint8Array($this.analyser.frequencyBinCount);
			$this.analyser.getByteFrequencyData(dataArray);

			$this.canvasContext.clearRect(0, 0, $this.canvas.width, $this.canvas.height);

			for (let i = 0; i < dataArray.length; i++)
			{
				if (hue + hueIncrement > hueMax)
				{
					turnBack =  true;
				}
				else if (hue - hueIncrement < hueMin)
				{
					turnBack = false;
				}
				hue = turnBack ? (hue - hueIncrement) % 360 : (hue + hueIncrement) % 360;

				const barHeight = dataArray[i];
				const x = Math.random() * $this.canvas.width;
				const y = Math.random() * $this.canvas.height;
				const radius = barHeight / 20; // 音の強さに応じてサイズを設定

				// パーティクルの描画
				$this.canvasContext.beginPath();
				$this.canvasContext.arc(x, y, radius, 0, Math.PI * 2);
				$this.canvasContext.fillStyle = "hsl(" + hue + ", 100%, 50%)";
				$this.canvasContext.fill();
			}

			animateID = window.requestAnimationFrame(drawCircle.bind($this));
		}

		let turnBack = false;
		// ブロックの描画
		function drawBlocks($this)
		{
			$this = this ?? $this;

			if (this == null && $this == null)
				return;
			
			if ($this.analyser == null)
				return;

			// Analyserノードから周波数データを取得
			const dataArray = new Uint8Array($this.analyser.frequencyBinCount);
			$this.analyser.getByteFrequencyData(dataArray);

			draw($this, dataArray);

			// 次のフレームで再描画
			animateID = window.requestAnimationFrame(drawBlocks.bind($this));
		}

		function draw($this, dataArray)
		{
			// キャンバスをクリア
			$this.canvasContext.clearRect(0, 0, $this.canvas.width, $this.canvas.height);

			// 色相を更新
			// hue = (hue + hueIncrement) % 360;
			// if (hue + hueIncrement > hueMax)
			// {
			// 	turnBack =  true;
			// 	console.log('hue--', hue);
			// }
			// else if (hue - hueIncrement < hueMin)
			// {
			// 	turnBack = false;
			// 	console.log('hue++', hue);
			// }
			// hue = turnBack ? (hue - hueIncrement) % 360 : (hue + hueIncrement) % 360;
			
			let margin = 0;
			for (let i = 0; i < dataArray.length; i++)
			{
				// 周波数値を0.0〜1.0の範囲に正規化
				const frequencyValue = dataArray[i] / 255;

				// console.log(frequencyValue, dataArray[i])
				let blockHeight = $this.canvas.height / 2 * frequencyValue;

				// 高さの最小値
				if (blockHeight == 0)
				{
					// blockHeight = $this.canvas.height * 0.05;
					blockHeight = $this.canvas.height * 0.05;
				}

				const xPos = i * blockWidth;
				const yPos = $this.canvas.height - blockHeight;
				margin += marginIncrement;

				// はみ出ない範囲で描画
				if (blockWidth + xPos + margin > $this.canvas.width)
				{
					return;
				}

				hue = (i + 300) % 360;

				/*
				const gradient = $this.canvasContext.createLinearGradient(xPos, 0, xPos, $this.canvas.height);
				// const gradient = $this.canvasContext.createLinearGradient(xPos, 0, blockWidth, $this.canvas.height);
				// const gradient = $this.canvasContext.createLinearGradient(xPos + margin, yPos, xPos + margin, $this.canvas.height);

				gradient.addColorStop(0.0, `hsl(${hue}, 100%, ${lightness}%)`);
				// グラデーションの色相を変更
				gradient.addColorStop(1.0, `hsl(${hue}, 100%, 0%)`);

				$this.canvasContext.fillStyle = gradient;

				$this.canvasContext.fillRect(xPos + margin, yPos, blockWidth, blockHeight);
				$this.canvasContext.fillRect(xPos + margin, yPos, blockWidth, blockHeight * 0.5);
				*/

				// 色相に基づいて塗りつぶし色を設定
				$this.canvasContext.fillStyle = `hsl(${hue}, 100%, 50%)`;
				// ブロックを描画
				$this.canvasContext.fillRect(xPos + margin, yPos, blockWidth, blockHeight);
			}
		}

		return SoundVisualizer;
	})();

// console.log(new sound())