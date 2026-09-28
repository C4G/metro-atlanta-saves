export function resolveE2ePorts(env = process.env) {
  const configuredApiPort = Number(env['API_PORT'] || 3000);
  const configuredGatewayPort = Number(env['FE_PORT'] || 4200);
  const configuredFrontendPort = Number(env['E2E_FRONTEND_SERVER_PORT'] || configuredGatewayPort + 1);
  const taskHash = env['NX_TASK_HASH'];

  if (!taskHash) {
    return {
      apiPort: configuredApiPort,
      gatewayPort: configuredGatewayPort,
      frontendPort: configuredFrontendPort,
    };
  }

  let hashValue = 0;
  for (const character of taskHash) {
    hashValue = (hashValue * 31 + character.charCodeAt(0)) % 6000;
  }

  const apiPort = 10000 + hashValue * 3;
  return {
    apiPort,
    gatewayPort: apiPort + 1,
    frontendPort: apiPort + 2,
  };
}
