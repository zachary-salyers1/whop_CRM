import { prisma } from "./prisma";

type TriggerType =
  | "membership_created"
  | "membership_cancelled"
  | "payment_succeeded"
  | "payment_failed";

type Action = {
  type: "add_tag" | "remove_tag" | "add_note" | "update_field";
  tagId?: string;
  tagName?: string;
  content?: string;
  field?: string;
  value?: string;
};

type EventContext = {
  memberId: string;
  companyId: string;
  triggerType: TriggerType;
  data?: any;
};

export async function executeAutomations(context: EventContext) {
  try {
    // Find all active automations for this company with matching trigger
    const automations = await prisma.automation.findMany({
      where: {
        companyId: context.companyId,
        isActive: true,
      },
    });

    // Filter by trigger type
    const matchingAutomations = automations.filter((automation) => {
      const trigger = automation.trigger as { type: TriggerType };
      return trigger.type === context.triggerType;
    });

    console.log(
      `Found ${matchingAutomations.length} matching automations for trigger ${context.triggerType}`
    );

    // Execute each automation
    for (const automation of matchingAutomations) {
      try {
        await executeAutomation(automation.id, context);
      } catch (error) {
        console.error(
          `Error executing automation ${automation.id}:`,
          error
        );
        // Continue with other automations even if one fails
      }
    }
  } catch (error) {
    console.error("Error in executeAutomations:", error);
  }
}

async function executeAutomation(automationId: string, context: EventContext) {
  const automation = await prisma.automation.findUnique({
    where: { id: automationId },
  });

  if (!automation) {
    console.error(`Automation ${automationId} not found`);
    return;
  }

  const actions = automation.actions as Action[];

  console.log(
    `Executing automation "${automation.name}" with ${actions.length} actions`
  );

  // Execute each action
  for (const action of actions) {
    try {
      await executeAction(action, context);
    } catch (error) {
      console.error(
        `Error executing action ${action.type} in automation ${automationId}:`,
        error
      );
      // Continue with other actions
    }
  }

  // Update automation stats
  await prisma.automation.update({
    where: { id: automationId },
    data: {
      runCount: { increment: 1 },
      lastRunAt: new Date(),
    },
  });

  console.log(`Automation "${automation.name}" executed successfully`);
}

async function executeAction(action: Action, context: EventContext) {
  switch (action.type) {
    case "add_tag":
      if (action.tagId) {
        await addTag(context.memberId, action.tagId);
      }
      break;

    case "remove_tag":
      if (action.tagId) {
        await removeTag(context.memberId, action.tagId);
      }
      break;

    case "add_note":
      if (action.content) {
        await addNote(
          context.memberId,
          context.companyId,
          action.content
        );
      }
      break;

    case "update_field":
      if (action.field && action.value !== undefined) {
        await updateMemberField(
          context.memberId,
          action.field,
          action.value
        );
      }
      break;

    default:
      console.warn(`Unknown action type: ${(action as any).type}`);
  }
}

async function addTag(memberId: string, tagId: string) {
  try {
    // Check if tag already exists
    const existing = await prisma.memberTag.findUnique({
      where: {
        tagId_memberId: {
          tagId,
          memberId,
        },
      },
    });

    if (!existing) {
      await prisma.memberTag.create({
        data: {
          memberId,
          tagId,
        },
      });
      console.log(`Added tag ${tagId} to member ${memberId}`);
    } else {
      console.log(`Tag ${tagId} already exists on member ${memberId}`);
    }
  } catch (error) {
    console.error("Error adding tag:", error);
  }
}

async function removeTag(memberId: string, tagId: string) {
  try {
    await prisma.memberTag.deleteMany({
      where: {
        memberId,
        tagId,
      },
    });
    console.log(`Removed tag ${tagId} from member ${memberId}`);
  } catch (error) {
    console.error("Error removing tag:", error);
  }
}

async function addNote(memberId: string, companyId: string, content: string) {
  try {
    await prisma.note.create({
      data: {
        memberId,
        companyId,
        content,
      },
    });
    console.log(`Added note to member ${memberId}`);
  } catch (error) {
    console.error("Error adding note:", error);
  }
}

async function updateMemberField(
  memberId: string,
  field: string,
  value: string
) {
  try {
    await prisma.member.update({
      where: { id: memberId },
      data: {
        [field]: value,
      },
    });
    console.log(`Updated ${field} to ${value} for member ${memberId}`);
  } catch (error) {
    console.error("Error updating member field:", error);
  }
}
