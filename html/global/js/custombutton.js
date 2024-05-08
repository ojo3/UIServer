	window.CustomButton = (function ()
	{
		let $this;
		function CustomButton()
		{
			this.button = null;
			$this = this;
		}

		CustomButton.create = function (parent, selector, text)
		{
			const btn = new CustomButton();
			btn.create(parent, selector, text);
			// console.log(btn);
			return btn;
		}
		CustomButton.prototype = {
			create: function (parent, selector, text)
			{
				if (parent == null)
					throw 'parent is NULL.';
				this.button = $(parent).create(`button${selector}`).attr('class', 'disable').text(text);
				return this;
			},
			filter: function (filter, target)
			{
				if (this.button == null)
					throw 'button is NULL.';
				const button = this.button;
				button.click(function ()
				{
					const video = $(target);
					if (video.length == 0)
						throw 'video.length is 0.';
					const contains = button.attr('class') == 'enable';
					const state = contains ? 'disable' : 'enable';
					button.attr('class', state);
					// console.log(target, filter)
					$(target).filter(filter);
				});
				return this;
			},
			playstate: function ()
			{
				return this;
			}
		}

		return CustomButton;
	})();
