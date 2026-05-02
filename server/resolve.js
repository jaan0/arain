const dns = require('dns');
dns.setServers(['8.8.8.8']);
dns.resolveSrv('_mongodb._tcp.cluster0.lyle6zv.mongodb.net', (err, addresses) => {
  if (err) console.error(err);
  else console.log(addresses);
});
