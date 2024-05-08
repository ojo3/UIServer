
	window.Toast = (function ()
	{
		const defaults = {
			type      : ['top', 'bottom'],
			position  : 'top',
			selector  : '.toast',
			offset    : 15,
			speed     : 350,
			sleep     : 2500,
			data_attr : 'data-toast',
			data_value: 'toast',
		};

		// static field
		let _total_offset_top = 0
		let _zIndex           = 0;
		let $this             = null;
		let isRunning         = false;

		// 初期化
		function Toast(selector = defaults.selector)
		{
			// プロパティ
			this.id        = `g-${Date.now()}`;
			this.selector  = `${selector}#${this.id}`;
			this.sleep     = defaults.sleep;
			this.slide     = true;
			this.autoClose = true;

			$this = this;
		}

		// private
		const defaultcss = () =>
		{
			return {
				'position'     : 'fixed',
				'display'      : 'inline-block',
				'padding'      : '10px 25px',
				'border-radius': '20px',
				'border'       : '2px solid #666',
				'box-shadow'   : '1px 1px 5px rgba(0, 0, 0, 0.2)',
				'opacity'      : '1',
				'white-space'  : 'pre-line',
				'word-break'   : 'break-all',
				'user-select'  : 'none',
				'cursor'       : 'pointer',
				'text-align'   : 'center',
				'min-width'    : '10%'
			};
		}

		const dispose = function ()
		{
			if (isRunning)
			{
				return;
			}

			_zIndex           = 0;
			_total_offset_top = 0;
			isRunning         = false;
			// console.log(isRunning);
		}

		// static
		Toast.clear = function (selector)
		{
			isRunning = false;
			// selectorの指定がない場合は、
			// 独自data-*属性を持った要素を全削除.
			selector = selector ?? `[${defaults.data_attr}="${defaults.data_value}"]`;
			$(selector).remove();
			dispose();
		}

		Toast.prototype = {
			constructor: Toast,
			setAutoClose: function (value)
			{
				this.autoClose = typeof value !== 'boolean' ? false : value;
				return this;
			},
			setSleep: function (value)
			{
				this.sleep = typeof value !== 'number' ? defaults.sleep : value;
				return this;
			},
			zindex: function (value)
			{
				_zIndex = typeof value !== 'number' ? 1 : value;
				return this;
			},
			show: function (message, position, callback)
			{
				isRunning = true;

				// インスタンスごとに生成！
				const obj = $('body').create(this.selector).attr(defaults.data_attr, defaults.data_value);

				position = position ?? defaults.position;

				const css = defaultcss();
				css['zIndex'] = _zIndex++;

				let offset  = defaults.offset;
				const speed = defaults.speed;

				if ($.inArray(position, defaults.type) < 0)
				{
					position = defaults.position;
				}

				obj.html(htmlspecialchars(message));

				// 以後cssを順次書き換えていく
				// objに外部CSSで背景色プロパティが宣言されていない場合はあてる
				if (obj.css('background-color') === 'rgba(0, 0, 0, 0)')
				{
					css['background-color'] = 'rgba(0, 0, 0, 0.7)';
					css['color'] = 'rgb(255, 255, 255)';
				}

				// css['fontSize'] = $('body').getcss('font-size');

				// console.log($('body').getcss('font-size'));

				// 基本のCSSをあてる
				obj.setcss(css);

				const bodySize = { width: $('body').width(), height: $('body').height() }
				const objSize = { width: obj.outerWidth(), height: obj.outerHeight() }

				// bodyの幅を超えたら半分にする
				if (objSize.width > bodySize.width)
				{
					obj.setcss({width: '50vw'});
				}

				// 開始位置をセット
				// slideがtrueならば高さマイナス位置から表示
				let start;
				if (this.slide)
				{
					start = objSize.height * -1;
					// 総オフセット数
					_total_offset_top += offset;
					// _total_offset_top = offset;
				}
				// スライドしない場合はoffsetをセット
				else
				{
					start = offset;
					_total_offset_top = offset;
				}

				// // window高を超えたらリセット
				// if (_total_offset_top + objSize.height >= window.innerHeight)
				// {
				// 	isTurnBack = true;
				// 	_total_offset_top = defaults.offset;
				// 	offset = 0;
				// }
				
				// if (isTurnBack)
				// 	obj.setcss('background: rgba(255, 0, 0, 0.2)');

				// オフセットトップを加算しなくてもいい気がする...
				// _total_offset_top = offset;

				// アニメーション用CSS
				const set = { start: start, end: _total_offset_top };

				// 次回呼ばれた際のためにtopオフセットを加算
				// 146行とセット
				if (this.slide)
				{
					// 総オフセット数
					_total_offset_top += _total_offset_top + objSize.height + offset < $(window).height() ? objSize.height : 0;;
				}
				// console.log(_total_offset_top, window.innerHeight);

				css['left'] = obj.getcenter().left;
				// x軸の初期位置をセット
				css[position] = set.start;
				css['opacity'] = '0';
				obj.setcss(css);

				// アニメーションでセットする値をセット
				css[position] = set.end;
				css['opacity'] = '1';

				obj.animate(css, speed, 'swing');

				// obj.setcss({ cursor: 'pointer' });

				// クリックしたら消す
				obj.click(function ()
				{
					isRunning = false;
					$this.hide(this, speed);
					if (typeof callback == 'function')
						callback();
				});

				if (this.autoClose)
				{
					const timer = setTimeout(function ()
					{
						// 表示初期位置に戻す
						css['opacity'] = '0';
						css[position] = set.start;

						obj.animate(css, speed, 'swing', function ()
						{
							$this.hide(this, speed);
							clearTimeout(timer);
						});
					}, this.sleep);
				}
				else
				{
					$(window).resize(() =>
					{
						obj.adjustWidth();
						obj.setcenterH();
					});
				}

				return obj;
			},
			hide: function (selector, speed = defaults.speed)
			{
				$(selector).animate({ 'opacity': '0' }, speed, 'swing', function ()
				{
					$(this).remove();
					dispose();
					isRunning = false;
				});
			}
		}

		return Toast;
	})();


	// const toast = new Toast();
	// const timer = setInterval(() => {
	// 	toast.show(`&<div>'"ファイル破損によりエンコードに失敗したファイルです."'`);
	// 	// clearInterval(timer);
	// }, 1000);