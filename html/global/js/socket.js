// const Socket = (function ()
const Socket = (() =>
{
	let webSocket = null;
	function Socket()
	{
	}

	let messages = [];
	let isConected = false;
	let events = null;
	Socket.connect = async (url, data, func) =>
	{
		if (url == undefined || url.length == 0)
		{
			return webSocket;
		}

		isConected = webSocket !== null;

		messages.push(data);
		webSocket = new WebSocket(url.replace('http', 'ws'));
		webSocket.onopen = async function (MessageEvent)
		{
			// console.log(messages);
			// console.log(webSocket.readyState, data);
			if (data != null)
			{
				// console.log(webSocket.readyState, data);
				if (webSocket.readyState == 1)
				{
					while (messages.length > 0)
					{
						const msg = messages.pop();
						webSocket.send(msg);
						// console.log(msg);
					}

					// webSocket.send(data);
				}
			}
			// console.log(data, MessageEvent);
		}
		webSocket.onmessage = function (MessageEvent)
		{
			if (func !== undefined && typeof func === 'function')
			{
				func(MessageEvent);
			}
			else
			{
				new Toast().show(MessageEvent.data, 'top');
			}
			// console.log(MessageEvent);
		}
		webSocket.onclose = function (MessageEvent)
		{
			webSocket = null;
			// console.log(MessageEvent);
		}
		webSocket.onerror = function (MessageEvent)
		{
			// console.log(MessageEvent);
		}

		return webSocket;
	};
	Socket.disconnect = () =>
	{
		// if (webSocket != null)
		// 	webSocket.disconnect();
	}

	Socket.fn = Socket.prototype = {
		
	}

	return Socket;

})();

