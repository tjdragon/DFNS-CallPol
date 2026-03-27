import { decodeFunctionData } from 'viem';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dfnsApi, SENDER_WALLET_ID } from './DFNSCommon.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


async function main() {
  try {
    const approvals = await dfnsApi.policies.listApprovals({
      query: {
        status: 'Pending'
      }
    });

    // Load Artifact for ABI decoding
    const artifactPath = path.join(__dirname, '../artifacts/contracts/StableCoin.sol/StableCoin.json');
    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Artifact not found at ${artifactPath}. Did you run 'npx hardhat compile'?`);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const { abi } = artifact;

    console.log(`--- Pending Approvals for Wallet: ${SENDER_WALLET_ID} ---`);


    for (const approval of approvals.items) {
      const activity = approval.activity as any;
      
      // Extract walletId from various potential activity structures
      const walletId = activity.walletId || 
                       activity.transferRequest?.walletId || 
                       activity.transactionRequest?.walletId || 
                       activity.signRequest?.walletId;

      if (walletId === SENDER_WALLET_ID) {
        console.log(`Approval ${approval.id}: ${activity.kind} (Status: ${approval.status})`);
        // console.log(JSON.stringify(approval, null, 2));
        const requestBody = activity.requestBody || 
                           activity.transferRequest?.requestBody || 
                           activity.transactionRequest?.requestBody || 
                           activity.signRequest?.requestBody;

        if (requestBody && requestBody.data) {
          const toAddress = requestBody.to;
          if (toAddress != '0x007cb8aafaa9eb5b411ebece99f1671a286d2ee8') {
            console.log("This is the wrong smart contract address. Rejecting")
            continue;
          } else {
            console.log("This is the correct smart contract address. Continuing")
            
          }
          
          console.log("Request Body:", JSON.stringify(requestBody, null, 2));
          let decoded: any;
          try {
            decoded = decodeFunctionData({
              abi,
              data: requestBody.data as `0x${string}`
            });
            console.log(`\n\x1b[32m>>> Decoded Call: ${decoded.functionName}\x1b[0m`);
            console.log(`Arguments:`, JSON.stringify(decoded.args, (key, value) =>
              typeof value === 'bigint' ? value.toString() : value, 2));
          } catch (e) {
            console.log("\n(Data could not be decoded with StableCoin ABI)");
          }

          if (decoded && decoded.functionName === 'mint') {
            console.log("! This is the mint function");
            const [destinationAddress, amount] = decoded.args as [string, bigint];
            console.log(`Destination Address: ${destinationAddress}`);
            console.log(`Amount: ${amount}`);

            if (destinationAddress != '0x126b39aFd4c1027168bf936B68C4d011793E7609') {
              console.log("This is the wrong destination address. Rejecting")
              await reject(approval.id)
            } else {
              console.log("This is the correct destination address. Continuing")
              if (amount <= 10000000) {
                console.log("Amount is less than 10,000,000. Approving")
                await approve(approval.id)
              } else {
                console.log("Amount is greater than 10,000,000. Rejecting")
                await reject(approval.id)
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to list approvals:", error);
    process.exit(1);
  }
}

async function approve(approvalId: string) {
  console.log(`Approving decision: ${approvalId}...`);
  await dfnsApi.policies.createApprovalDecision({
    approvalId,
    body: {
      value: 'Approved',
      reason: 'Verified transaction details with finance team'
    }
  })
  console.log("Decision approved successfully.");
}

async function reject (approvalId: string) {
  console.log(`Rejecting decision: ${approvalId}...`);
  await dfnsApi.policies.createApprovalDecision({
    approvalId,
    body: {
      value: 'Denied',
      reason: 'Recipient address not verified'
    }
  })
  console.log("Decision rejected successfully.");
}

main();
