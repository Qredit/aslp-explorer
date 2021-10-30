const http = require('http');
const https = require('https');
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const request = require('request');
const session = require('express-session')
const csrf = require('csurf')
const flatten = require('flat')
//const Big = require('big.js');
const { promisify } = require('util');
//const sqlite3 = require('sqlite3');
//const asyncv3 = require('async');

// libs

var motionsdk = require("motion-sdk");
const arkApi = motionsdk.arkApi;
const aslpApi = motionsdk.aslpApi;

const aslpapi = new aslpApi.default();
const aapi = new arkApi.default();

const qreditjs = require("qreditjs");
const arkjs = require("arkjs");


var indexRouter = require('./routes/index');
// const { paused } = require('browser-sync');

var serverPort = 5300;

var app = express();


var server = http.createServer(app);
var io = require('socket.io').listen(server);

server.listen(serverPort);


////
// Web Stuff

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
	extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
	secret: 'justsomerandomness191919',
	resave: false,
	saveUninitialized: true,
	cookie: {
		maxAge: 864000
	}
}));
app.use(csrf());

app.use('/', indexRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});



////

io.on('connection', function (socket) {

	/************************************************************************
	  ___ ___   _   ___  ___ _  _   ___ _   _ _  _  ___ _____ ___ ___  _  _
	 / __| __| /_\ | _ \/ __| || | | __| | | | \| |/ __|_   _|_ _/ _ \| \| |
	 \__ \ _| / _ \|   / (__| __ | | _|| |_| | .` | (__  | |  | | (_) | .` |
	 |___/___/_/ \_\_|_\\___|_||_| |_|  \___/|_|\_|\___| |_| |___\___/|_|\_|

	 ************************************************************************/


	/* ark */
	socket.on('search', function (input) {

		(async () => {
			var blockResults = await aapi.getBlockByID(input)
			var walletResults = await aapi.getWalletByID(input)
			var transactionsResult = await aapi.getTransactionByID(input)
			var delegateResult = await aapi.getDelegate(input)
			var tokensResult = await aslpapi.getToken(input);

			var blockParsed = null
			if (blockResults.data) {
				blockParsed = blockResults.data;

				if (blockResults.data.length > 1)
					blockParsed = blockResults.data[0]
			}

			var walletParsed = null
			if (walletResults.data)
				walletParsed = walletResults.data;

			var transactionParsed = null
			var tokenTransactions = null
			if (transactionsResult.data) {
				if (transactionsResult.data.vendorField.toString().includes('aslp1'))
					tokenTransactions = transactionsResult.data
				else
					transactionParsed = transactionsResult.data;
			}

			var delegateParsed = null
			if (delegateResult.data)
				delegateParsed = delegateResult.data;

			/*var tokensParsed = tokensResult.length > 0 ? tokensResult[0] : null*/

			var returnValue = {
				blocks: blockParsed,
				wallets: walletParsed,
				transactions: transactionParsed,
				tokenTransactions: tokenTransactions,
				delegates: delegateParsed,
				/*tokens: tokensParsed*/
			}

			socket.emit('showsearch', returnValue);

		})();
	});

	/*********************************************************************

		ark

	 ********************************************************************/

	/*

	1. getdelegates  // done
	2. getlastblock  // done
	3. getblocks  // done
	4. getpeers  // done
	5. gettransactions  // done
	6. getwallet  // done
	7. gettopwallets  // done
	8. getwallettransactions  // done
	9. gettransactiondetails  // done
	10. getdelegatebyid  // done
	11. getnodeconfig  // done
	12. getblockbyid

	*/

	// Socket IO getdelegates

	socket.on('getdelegates', function (input) {

		(async () => {

			var response = await aapi.listDelegates(1, 51);
			var data = response.data;
			console.log(data)
			var flatJson = [];
			for (let i = 0; i < data.length; i++) {
				let tempJson = {
					rank: data[i].rank,
					address: data[i].address,
					username: data[i].username,
					blocks: data[i].blocks.produced,
					timestamp: data[i].blocks.last.timestamp.human,
					approval: data[i].production.approval,
					votes: (parseFloat(data[i].votes) / 100000000).toFixed(0)
				};
				flatJson.push(tempJson);
			}
			//console.log(flatJson)
			socket.emit('showdelegates', flatJson);

		})();

	});

	// Socket IO getblocks

	socket.on('getlastblock', function (input) {

		(async () => {

			var response = await aapi.getLastBlock();
			var data = (response.data);
			var flatJson = {
				getlastblockheight: data.height,
				getlastforgedusername: data.generator.username
			};

			socket.emit('showlastblock', flatJson);

		})();

	});

	// Socket IO getblocks

	socket.on('getblocks', function (input) {

		(async () => {

			var response = await aapi.listBlocks(1, 50);
			var data = response.data;
			var flatJson = [];
			for (let i = 0; i < data.length; i++) {
				let tempJson = {

					id: data[i].id,
					height: data[i].height,
					timestamp: data[i].timestamp.human,
					rewardtotal: data[i].forged.total,
					transactionsforged: data[i].transactions,
					lastforgedusername: data[i].generator.username,
					address: data[i].generator.address,

				};
				flatJson.push(tempJson);
			}
			socket.emit('showblocks', flatJson);
		})();

	});

	// Socket IO getpeers

	socket.on('getpeers', function (input) {

		(async () => {

			var response = await aapi.getPeers();
			var data = response.data;

			var flatJson = [];
			for (let i = 0; i < data.length; i++) {
				let tempJson = {
					peerip: data[i].ip,
					p2pport: data[i].port,
					version: data[i].version,
					height: data[i].height,
					latency: data[i].latency
				};
				flatJson.push(tempJson);
			}

			socket.emit('showpeers', flatJson);
		})();

	});

	// Socket IO gettransactions
	socket.on('gettransactions', function (input) {

		(async () => {

			var response = await aapi.listTransactions();
			var data = response.data;
			var flatJson = [];
			for (let i = 0; i < data.length; i++) {
				let tempJson = {
					id: data[i].id,
					confirmations: data[i].confirmations,
					timestamp: data[i].timestamp.human,
					sender: data[i].sender,
					recipient: data[i].recipient,
					smartbridge: (data[i].vendorField == undefined ? '<span></span>' : data[i].vendorField),
					//smartbridge: data[i].vendorField,
					amount: data[i].amount,
				};
				flatJson.push(tempJson);
			}

			socket.emit('showtransactions', flatJson);

		})();

	});

	// Socket IO getwallet 

	socket.on('getwallet', function (input) {

		(async () => {

			response = await aapi.getWalletByID(input.walletId);

			var data = (response.data);
			var flatJson = {
				address: data.address,
				publickey: data.publicKey,
				balance: (parseFloat(data.balance) / 100000000).toFixed(8),
				isdelegate: data.isDelegate == true ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-danger">No</span>'
			};

			socket.emit('showwallet', flatJson);

		})();

	});

	// Socket IO getwallettransactions

	socket.on('getwallettransactions', function (input) {

		(async () => {

			response = await aapi.getWalletTransactions(input.walletId);
			var data = (response.data);
			var flatJson = [];
			for (let i = 0; i < data.length; i++) {
				let tempJson = {
					id: data[i].id,
					timestamp: data[i].timestamp.human,
					sender: data[i].sender,
					recipient: data[i].recipient,
					amount: data[i].amount,
					smartbridge: data[i].vendorField,
					confirmations: data[i].confirmations,
				};
				flatJson.push(tempJson);
			}

			socket.emit('showwallettransactions', flatJson);
		})();

	});


	// Socket IO gettransactiondetails

	socket.on('gettransactiondetails', function (input) {

		(async () => {

			response = await aapi.getTransactionByID(input.transactionId);

			var aslpdata = await aslpapi.getTransaction(input.transactionId);

			if (aslpdata) {
				response.data.aslp = aslpdata[0];
			}
			var data = (response.data);
			var flatJson = {
				txid: data.id,
				blockid: data.blockId,
				id: data.id,
				amount: (parseFloat(data.amount) / 100000000).toFixed(8),
				fee: data.fee,
				sender: data.sender,
				publickey: data.senderPublicKey,
				recipient: data.recipient,
				smartbridge: data.vendorField,
				confirmations: data.confirmations,
				timestamp: data.timestamp.human,
				nonce: data.nonce,
				signature: data.signature,
			};
			console.log(flatJson)
			socket.emit('showtransactiondetails', flatJson);
		})();

	});

	// Socket IO getdelegatebyid 

	socket.on('getdelegatebyid', function (input) {

		(async () => {

			response = await aapi.getDelegate(input.walletId);

			var data = (response.data);

			var flatJson = {
				username: data.username == null ? '<span>Not a delegate</span>' : data.username,
				votes: (parseFloat(data.votes) / 100000000).toFixed(0) + ' XQR',
				rank: data.rank,
				blocksproduced: data.blocks.produced,
				lastproducedblock: data.blocks.last.id,
				approval: data.production.approval + '%',
				isresigned: data.isResigned == true ? '<span class="badge badge-success">Yes</span>' : '<span class="badge badge-danger">No</span>'
			};
			socket.emit('showdelegatebyid', flatJson);

		})();

	});

	socket.on('getblockbyid', function (input) {

		(async () => {

			var response = await aapi.getBlockByID(input.blockId);
			var data = response.data;
			console.log(data)
			var flatJson = [];

			for (let i = 0; i < data.length; i++) {
				let tempJson = {
					id: data[i].id,
				};
				flatJson.push(tempJson);
			}

			socket.emit('showblockbyid', flatJson);
			console.log(flatJson)
		})();

	});

	/**************************************************************
																		
	  _  _  ___  ___  ___    ___  ___ _    ___     _   ___ ___
	 | \| |/ _ \|   \| __|  / _ \/ __| |  | _ \   /_\ | _ \_ _|
	 | .` | (_) | |) | _|  | (_) \__ \ |__|  _/  / _ \|  _/| |
	 |_|\_|\___/|___/|___|  \__\_\___/____|_|   /_/ \_\_| |___|

	 
	 **************************************************************/

	/* 

	1. gettokenlist  // done
	2. getwallettokens  // done
	3. gettokeninfo  // done
	4. gettokenmeta  // done

	*/


	/* gettokenlist */

	socket.on('gettokenlist', function (input) {

		var page = input.page;
		var limit = input.limit;

		(async () => {

			var data = await aslpapi.listTokens(100, 1);

			var flatJson = [];

			for (let i = 0; i < data.length; i++) {
				let tempJson = {
					version: data[i].type,
					name: data[i].tokenDetails.name,
					symbol: data[i].tokenDetails.symbol,
					owneraddress: data[i].tokenDetails.ownerAddress,
					tokenid: data[i].tokenDetails.tokenIdHex,
					circsupply: data[i].tokenStats.qty_token_circulating_supply == undefined ? '1 ' : data[i].tokenStats.qty_token_circulating_supply,
					pausable: data[i].tokenDetails.pausable == true ? '<img alt="ok" src="/img/ok-24.png">' : '<img alt="ok" src="/img/offline-24.png">',
					mintable: data[i].tokenDetails.mintable == true ? '<img alt="ok" src="/img/ok-24.png">' : '<img alt="ok" src="/img/offline-24.png">'
				};
				flatJson.push(tempJson);
			}

			socket.emit('showtokenlist', flatJson);

		})();

	});

	// Socket IO getwallettokens

	socket.on('getwallettokens', function (input) {

		(async () => {

			var response = await aslpapi.getTokensByOwner(input.walletId);
			var data = response;

			var flatJson = [];
			for (let i = 0; i < data.length; i++) {
				let tempJson = {
					type: data[i].type,
					owneraddress: data[i].tokenDetails.ownerAddress,
					tokenid: data[i].tokenDetails.tokenIdHex,
					name: data[i].tokenDetails.name,
					symbol: data[i].tokenDetails.symbol,
					genesisquantity: (data[i].tokenDetails.genesisQuantity == undefined ? '<span class="badge badge-success" style="background:green;">NFT (1)</span>' : data[i].tokenDetails.genesisQuantity),
					circsupply: (data[i].tokenStats.qty_token_circulating_supply == undefined ? '<span class="badge badge-success" style="background:green;">NFT (1)</span>' : data[i].tokenStats.qty_token_circulating_supply),
					pausable: data[i].tokenDetails.pausable == true ? '<span class="badge badge-success" style="background:green;">True</span>' : '<span class="badge badge-danger" style="background:red;">False</span>',
					mintable: data[i].tokenDetails.mintable == true ? '<span class="badge badge-success" style="background:green;">True</span>' : '<span class="badge badge-danger" style="background:red;">False</span>',
					tokenowners: data[i].tokenStats.qty_valid_token_addresses,
					documenturi: data[i].tokenDetails.documentUri

				};
				flatJson.push(tempJson);
			}

			socket.emit('showwallettokens', flatJson);

		})();

	});

	// Socket IO gettokeninfo

	socket.on('gettokeninfo', function (input) {

		(async () => {

			var data = await aslpapi.getToken(input.tokenid);
			var data = (data);
			var tempJson = {

				/* first */
				type: data.type,
				paused: data.paused,
				lastupdatedblock: data.lastUpdatedBlock,

				/* nested under tokenDetails */
				owneraddress: data.tokenDetails.ownerAddress,
				tokenidhex: data.tokenDetails.tokenIdHex,
				timestamp: data.tokenDetails.genesis_timestamp,
				aslpversion: data.tokenDetails.versionType,
				symbol: data.tokenDetails.symbol,
				name: data.tokenDetails.name,
				documenturi: data.tokenDetails.documentUri,
				decimals: data.tokenDetails.decimals,
				genesisquantity: data.tokenDetails.genesisQuantity,
				pausable: data.tokenDetails.pausable,
				mintable: data.tokenDetails.mintable,

				/* nested under tokenStats */
				blockcreatedheight: data.tokenStats.block_created_height,
				blockcreatedid: data.tokenStats.block_created_id,
				blocklastactivesend: data.tokenStats.block_last_active_send,
				blocklastactivemint: data.tokenStats.block_last_active_mint,
				creationtxid: data.tokenStats.creation_transaction_id,
				qtyvalidtxnssincegenesis: data.tokenStats.qty_valid_txns_since_genesis,
				qtyvalidtokenaddresses: data.tokenStats.qty_valid_token_addresses,
				qtytokenminted: data.tokenStats.qty_token_minted,
				qtytokenburned: data.tokenStats.qty_token_burned,
				qtytokencirculatingsupply: data.tokenStats.qty_token_circulating_supply,
				qtyxqrspent: data.tokenStats.qty_xqr_spent,

			};

			socket.emit('showtokeninfo', tempJson);
		})();

	});

	// Socket IO gettokenmeta

	socket.on('gettokenmeta', function (input) {

		(async () => {
			var data = await aslpapi.getTokenWithMeta(input.tokenid);
			var flatJson = [];
			var data = (data.metadata)
			for (let i = 0; i < data.length; i++) {
				let tempJson = {
					metatxid: data[i].txid,
					metablockid: data[i].blockId,
					metablockheight: data[i].blockHeight,
					posteraddress: data[i].metaDetails.posterAddress,
					timestamp: data[i].metaDetails.timestamp,
					metaname: data[i].metaDetails.metaName,
					metachunk: data[i].metaDetails.metaChunk,
					metadata: data[i].metaDetails.metaData,
					void: data[i].void,
				};
				flatJson.push(tempJson);
			}
			socket.emit('showtokenmeta', flatJson);
		})();

	});

});


