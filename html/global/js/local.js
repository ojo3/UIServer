
			const wheelRate = 96;
			const map = {};
			let selectedTag = null;
			let currentIndex = 0;

			/* dir */
			function swipeInitialize()
			{
				const ol = document.getElementById('slippylist');
				if (ol != null)
				{
					ol.addEventListener('slip:afterswipe', function (e)
					{
						const item = $(e.target);
						const guid = item.attr('data-guid');
						if (guid != null)
						{
							item.setcss('opacity: 0');
							const url = `${location.protocol}//${location.host}/video.dir/delete/${guid}`;
							new Http()
							.settings({ progress: false })
							.get(url)
							.always((_s, _e, jqXHR) =>
							{
								if (jqXHR.status == 200) item.remove();
								else item.setcss('opacity: 1');
								// console.log(jqXHR);
								Toast.clear();
								const message = jqXHR.status == 200 ? jqXHR.responseText : jqXHR;
								new Toast().show(message);
							})
						}
					}, false);
					ol.addEventListener('slip:beforereorder', function (e) {
						if (/no-reorder/.test(e.target.className))
						{
							e.preventDefault();
						}
					}, false);
					new Slip(ol);
				}
			}

			function IndexReload()
			{
				if ($('#refresh').length == 0)
				{
					$('#container')
					.create('button#refresh')
					.setcenterH()
					.text('Refresh')
					.click(function ()
					{
						const page = location.pathname.split('/')[1];
						$(this).attr('disabled', 'true');
						let url = location.href;
						let xhr = new Http()
						.settings({ progress: false })
						.get(`${location.origin}/${page}/reload/test`)
						.always((data, textStatus, jqXHR) =>
						{
							new Toast().show(data);
						});
						return false;
					});
				}
			}

			function optionToggle(selector)
			{
				// const dummy = $('body').create('#dummy').setcenter();
				// 最初のセレクタが入る
				const obj = $(selector);
				const pathes = location.pathname.split('/');
				const args = {};
				for (let i = 0; i < pathes.length; i++)
				{
					if (i == 0) i += 2;
					// args[pathes[i]] = decodeURI(pathes[++i]);
					args[pathes[i]] = pathes[++i];
				}
				// console.log(args);

				if (isiOS)
				{
					// IOS用
					$('#programs span').each(function ()
					{
						$(this).children().unwrap();
					});

					// windowsには重い
					// optionをラップして
					$('#programs option').wrap('<span>');
					// すべてのspanを非表示にする
					$('#programs span').hide();
				}
				else
				{
					$('#programs option').hide();
				}

				let take = Math.round(obj.outerWidth() / parseInt($('body').css('font-size')) - 3);
				if (take < 15) take = 15;
				take = Math.round(take / 2);

				// タグ名、番組名の両コンボボックスの初期化
				obj.each(function ()
				{
					const $this = $(this);
					// const selectedIndex = obj.prop('selectedIndex');
					const children = $this.find('option');
					const id = $this.prop('id');

					const option = $this.find(`option[data-tag="${obj.val()}"], option[value="all"]`);

					// data-tagに引っかかった要素がある場合
					if (option.length > 1)
					{
						if (isiOS)
						{
							option.unwrap().show();
						}
						else
						{
							option.show();
						}
					}
					else
					{
						if (isiOS)
						{
							if ($this[0].id == 'programs')
							{
								children.unwrap().show();
							}
							else
							{
								children.show();
							}
						}
						else
						{
							children.show();
						}
					}
					
					const key = id == 'tags' ? 'tg' : 'pr';

					// 選択項目の検索
					const find = $this.find(`option[value="${args[key]}"]`).prop('selected', true);

					if (!isPc)
					{
						return;
					}

					if (find.length > 0)
					{
						// wheel用
						if ($this[0].id == 'tags')
						{
							if (find[0].value !== 'all')
							{
								selectedTag = find[0].value;
								// console.log(decodeURI(selectedTag));
							}
						}
						else if ($this[0].id == 'programs')
						{
							if (map[selectedTag] != null)
							{
								currentIndex = map[selectedTag].indexOf(find[0].index);
							}
							else
							{
								currentIndex = 0;
							}
						}
					}

					children.each(function ()
					{
						const option = $(this);
						let text = option.text();
						if (text.length > take * 2)
						{
							const regex = /\s?\(\d+\)/gi;
							const m = regex.exec(text);
							if (m != null)
							{
								text = text.replace(m[0], '');
								text = text.substr(0, take / 2) + '...' + text.substr(text.length - (take / 2), take / 2) + m[0];
							}
							option.text(text);
						}
						option.attr({ title: text });
					});
				});
			}

			function getThumbNail()
			{
				$('[data-src]').each(function ()
				{
					try
					{
						const img = $(this);
						img[0].src = "/global/images/loading.svg";
						const src = img.attr('data-src');
						const http = new XMLHttpRequest();
						http.open('HEAD', src, false);
						http.send();
						if (http.status == 200)
						{
							img[0].src = src;
						}
						else
						{
							img[0].src ='/global/images/error.jpg';
						}
					}
					catch (error)
					{
						
					}
				});
			}

			/* video */
			function GetPagenation()
			{
				const page = {};
				$('link').each(function ()
				{
					const link = $(this);
					const rel = link.attr('rel');
					if (rel != 'prev' && rel != 'next')
						return;
					const href = link.attr('href');
					if (href)
						page[rel] = href;
				});

				return page;
			}

			function ScrollToSeriesItem()
			{
				const timer = setTimeout(() =>
				{
					let bottom = 0;

					const local = location.pathname + location.search
					const parent = $('#series').next();
					const a = $(`[href="${local}"]`);
					const href = a.attr('href');
					if (a.offset() === undefined)
					{
						return;
					}
					const at = a.offset().top;
					const pt = parent.offset().top;
					const ph = parent.innerHeight() / 2;

					// スクロール起点が上
					if (at > pt)
					{
						bottom = Math.round(at - pt - ph);
					}
					else
					{
						bottom = Math.round(ph);
					}

					a.parent().addClass('active');
					
					if (bottom > 0)
					{
						parent.stop().animate({ scrollTop: bottom }, 800)
					}

					clearTimeout(timer);
				}, 800);
			}

			function windowResized()
			{
				if ($('video').outerHeight() > $(window).outerHeight() / 2)
				{
					$('video').setcss(`height: ${$(window).outerHeight() / 2}`);
				}
			}

			function wheelHandler()
			{
				const tags = $('#tags');
				const programs = $('#programs');

				if (tags.length == 0 || programs.length == 0)
				{
					return;
				}

				for (let i = 1; i < tags[0].children.length; i++)
				{
					const option = $(tags[0].children[i]);
					map[option[0].value] = programs.children().where(e => e.attr('data-tag') === option[0].value).selectBy(e => e[0].index).toArray();
					map[option[0].value].unshift(0);
				}
				// console.log(map);

				$('select').on('change', function ()
				{
					const $this = $(this);

					if ($this[0].id === 'tags')
					{
						selectedTag = $this.val();
						currentIndex = 0;
					}
					else
					{
						if (map[selectedTag] != null)
						{
							const index = map[selectedTag].indexOf($this[0].selectedIndex);
							if (index != -1)
							{
								currentIndex = index;
							}
						}
					}
				});

				$('select').on('wheel', function (e)
				{
					e.preventDefault();

					let isChange = false;
					const $this = $(this);
					const selectedIndex = ($this[0].id === 'programs' ? currentIndex : $this[0].selectedIndex) + (e.originalEvent.wheelDeltaY / wheelRate * -1);
					
					if (selectedIndex < 0 || selectedIndex >= $this[0].length)
					{
						return;
					}

					// console.log(selectedIndex, $this[0].length);

					if ($this[0].id === 'programs')
					{
						if (map[selectedTag] == null)
						{
							$this[0].selectedIndex = selectedIndex;
						}
						else
						{
							$this[0].selectedIndex = map[selectedTag][selectedIndex];
						}
						currentIndex += e.originalEvent.wheelDeltaY / wheelRate * -1;
						isChange = true;
					}
					else
					{
						$this[0].selectedIndex = selectedIndex;
						selectedTag = $this.val();
						currentIndex = 0;
						isChange = true;
					}

					if (isChange)
					{
						$this.trigger('change');
					}
					console.log(selectedIndex, $this[0].selectedIndex);
				});
			}

			/*
			function createControlBotton(selector, text, message, func)
			{
				const cookie = Cookie.load();
				let jump = cookie.jump;
				let loop = cookie.loop;

				const button = createButton(selector, text)
				.click(function ()
				{
					const state = setState(this);

					$(this).val(state);

					const cookie = {};

					if (func == 'loop')
					{
						loop = !loop;
						cookie['loop'] = loop;
						$('#video').attr('loop', loop);
					}
					else if (func == 'jump')
					{
						jump = !jump;
						cookie['jump'] = jump;
					}

					Cookie.save(cookie);

					const mess = { enable: message + 'ON', disable: message + 'OFF' };
					Toast.clear();
					new Toast().show(mess[state]);
				});

				if ((func == 'jump' && jump) || (func == 'loop' && loop))
				{
					button.attr('class', 'enable')
				}
			}

			function setState(obj)
			{
				const contains = $(obj).attr('class') == 'enable';
				const state = contains ? 'disable' : 'enable';
				$(obj).attr('class', state);
				return state;
			}
			*/

			// console.log(this, window);
			
			// wheelイベントでchangeしてみた！
			$(() =>
			{
				if (isPc)
				{
					wheelHandler();
				}
				
				function generateRequestUrl(tag, programName, page)
				{
					return [
						location.origin,
						'video.dir',
						'tg', tag,
						'pr', programName,
						'p', page].join('/');
				}

				/*
				$('body').create('button').setcss(`
					position: absolute;
					top: 0;
					right: 0;
				`).text('tag')
				.click((e) =>
				{
					const selector = 'ul#rrr';
					if ($(selector).length == 0)
					{
						const layer = $('body').createLayer(selector, true);

						const menu = $('body').create(selector).setcss(`
							position: fixed;
							width: 420px;
							height: ${window.outerHeight * 0.8}px;
							right: ${window.outerWidth - e.pageX}px;
							top: ${e.pageY}px;
							background: #555;
							margin: 0;
							padding: 2px 2px 2px 28px;
							overflow-y: scroll;
							border-radius: 8px;
							list-style-type: none;
						`);

						menu.setcenter();
						const menus = {};
						for (const iterator of $('#programs').children())
						{
							const tag = $(iterator).attr('data-tag');
							const key = decodeURI(tag);

							if (tag == null)
							{
								continue;
							}

							if (menus[key] == null)
							{
								menus[key] = [];
							}

							menus[key].push({ text: $(iterator).text(), value: $(iterator).val() });
						}

						for (const key in menus)
						{
							const li = menu.create('li').setcss('cursor: pointer').text(key).click((e) =>
							{
								if (e.target == e.currentTarget)
									$(e.currentTarget.children[0]).slideToggle();
							});

							const ul = li.create('ul').setcss('display: none');

							for (let i = 0; i < menus[key].length; i++)
							{
								const url = generateRequestUrl(key, menus[key][i].value);
								const li = ul.create('li a').attr('href', url).text(menus[key][i].text);
								li.click((e) =>
								{
									e.preventDefault();
									new Http().get(e.target.href)
									.done((data) =>
									{
										history.replaceState(null, null, url);
										$('#page').html(data);
										$('.reload').attr({ href: url });
										swipeInitialize();
										initializePlayer();
									});
									return false;
								});
							}
						}
					}
					else
					{
						$(selector).remove();
					}
				});
				*/
			})