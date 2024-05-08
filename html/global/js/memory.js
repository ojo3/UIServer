	const MemoryMonitor = (function ()
	{
		const isSupported = /chrome|edge|opera/i.test(window.navigator.userAgent);

		function MemoryMonitor()
		{

		}

		MemoryMonitor.prototype = {
			listen: function (interval = 1000)
			{
				if (!isSupported || isiOS)
				{
					console.log('not supported.');
					return;
				}

				if (interval < 10)
				{
					console.log('too short.');
					return;
				}

				window.onload = () =>
				{
					const info = $('body').create()
						.setcss(`text-align: right;
							z-index: 9;
							position: fixed;
							bottom: 0;
							left: 0;
							padding: 5px;
							background-color: rgba(0, 0, 0, 0.5);
							color: #fff;
							width: calc(100% - 10px)`)
						.text('ready.');
					$('.selectBox').setcss('bottom: 36px');
					setInterval(() => {
						info.html(this.info());
					}, interval);
				}
			},
			info: function (debug = false)
			{
				if (!isSupported || isiOS)
				{
					console.log('not supported.');
					return;
				}
				const info = {
					Total: fileSizeCalc(performance.memory.totalJSHeapSize) + ' Mb',
					Used: fileSizeCalc(performance.memory.usedJSHeapSize) + ' Mb'
				};
				if (debug)
					console.log(info);
				return JSON.stringify(info).replace(/["{}]/g, '').replace(/:/g, ':&nbsp;').replace(',', ', ');
			}
		}

		MemoryMonitor.info = function (debug = false)
		{
			return this.prototype.info(debug);
		}

		function fileSizeCalc(byte)
		{
			return (byte / 1048576).toFixed(2);
		}

		return MemoryMonitor;
	})();

	if (isPc)
	{
		const mm = new MemoryMonitor();
		mm.listen();
		console.log(mm);
	}


