import { getSystemResources } from '@qvac/sdk';

async function main() {
  console.log("Testing QVAC SDK system resources...");
  try {
    const resources = await getSystemResources({ sample: true });
    console.log("QVAC system resources status:", resources ? "SUCCESS" : "EMPTY");
    console.log(JSON.stringify(resources, null, 2));
  } catch (err) {
    console.error("QVAC system resources error:", err);
  }
}

main();
