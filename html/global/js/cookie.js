const Cookie = (() =>
{
	function Cookie() { }

	Cookie.save = function (obj, expire = 3600)
	{
		if (obj == null)
			return;

		for (const key in obj) {
			// if (obj[key] == undefined) continue;
			document.cookie = `${key}=${obj[key]}; max-age=${expire}`;
		}
	}

	Cookie.load = function ()
	{
		const cookies = document.cookie;
		if (cookies.length == 0)
			return null;
		const cookie = {};
		const array = cookies.split('; ');
		array.forEach(function (content) {
			const value = content.split('=');
			// stringなので文字列として比較すればboolにキャストできる
			cookie[value[0]] = value[1] == 'true';
		});
		return cookie;
	}

	return Cookie;
})();

