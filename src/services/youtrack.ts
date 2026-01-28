import { z } from "zod";

// YouTrack API configuration
const YOUTRACK_URL = process.env.YOUTRACK_URL || "";
const YOUTRACK_TOKEN = process.env.YOUTRACK_TOKEN || "";
const YOUTRACK_CLIENT_FIELD = process.env.YOUTRACK_CLIENT_FIELD || "Client";
const YOUTRACK_PROJECT_ID = process.env.YOUTRACK_PROJECT_ID || "0-0";

// Type definitions
export interface YouTrackUser {
  id: string;
  login: string;
  fullName: string;
  avatarUrl?: string;
}

export interface YouTrackCustomField {
  id: string;
  name: string;
  value: unknown;
  $type: string;
}

export interface YouTrackVisibilityGroup {
  id: string;
  name: string;
}

export interface YouTrackVisibility {
  permittedGroups?: YouTrackVisibilityGroup[];
  $type: string;
}

export interface YouTrackComment {
  id: string;
  text: string;
  created: number;
  updated?: number;
  author: YouTrackUser;
  visibility?: YouTrackVisibility;
}

export interface YouTrackIssue {
  id: string;
  idReadable: string;
  summary: string;
  description?: string;
  created: number;
  updated?: number;
  resolved?: number;
  reporter?: YouTrackUser;
  updatedBy?: YouTrackUser;
  customFields: YouTrackCustomField[];
  comments?: YouTrackComment[];
}

// Transformed types for CCS
export interface CCSTicket {
  id: string;
  idReadable: string;
  summary: string;
  description?: string;
  created: Date;
  updated?: Date;
  resolved?: Date;
  reporter?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  client?: string;
  type?: string;
  state?: string;
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  estimation?: string;
  dueDate?: Date;
  priority?: string;
}

export interface CCSComment {
  id: string;
  text: string;
  created: Date;
  updated?: Date;
  author: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  isPublic: boolean;
}

// Zod schemas for validation
export const CreateTicketSchema = z.object({
  summary: z.string().min(1, "Summary is required"),
  description: z.string().optional(),
  type: z.string().optional(),
  assignee: z.string().optional(),
});

export const UpdateTicketSchema = z.object({
  summary: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  state: z.string().optional(),
  assignee: z.string().optional(),
});

export const CreateCommentSchema = z.object({
  text: z.string().min(1, "Comment text is required"),
});

// Public visibility groups
const PUBLIC_GROUPS = ["CCS-Public", "All Users"];

// Helper function for API calls
async function youtrackFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${YOUTRACK_URL}/api${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${YOUTRACK_TOKEN}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTrack API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Extract custom field value
function getCustomFieldValue(
  fields: YouTrackCustomField[],
  fieldName: string
): unknown {
  const field = fields.find((f) => f.name === fieldName);
  if (!field) return undefined;

  // Handle different field types
  if (field.$type === "SingleEnumIssueCustomField" && field.value) {
    return (field.value as { name: string }).name;
  }
  if (field.$type === "SingleUserIssueCustomField" && field.value) {
    const user = field.value as { id: string; fullName: string; avatarUrl?: string };
    return { id: user.id, name: user.fullName, avatarUrl: user.avatarUrl };
  }
  if (field.$type === "PeriodIssueCustomField" && field.value) {
    const period = field.value as { presentation: string };
    return period.presentation;
  }
  if (field.$type === "DateIssueCustomField" && field.value) {
    return new Date(field.value as number);
  }

  return field.value;
}

// Transform YouTrack issue to CCS ticket
function transformIssue(issue: YouTrackIssue): CCSTicket {
  const assignee = getCustomFieldValue(issue.customFields, "Assignee");

  return {
    id: issue.id,
    idReadable: issue.idReadable,
    summary: issue.summary,
    description: issue.description,
    created: new Date(issue.created),
    updated: issue.updated ? new Date(issue.updated) : undefined,
    resolved: issue.resolved ? new Date(issue.resolved) : undefined,
    reporter: issue.reporter
      ? {
          id: issue.reporter.id,
          name: issue.reporter.fullName,
          avatarUrl: issue.reporter.avatarUrl,
        }
      : undefined,
    client: getCustomFieldValue(issue.customFields, YOUTRACK_CLIENT_FIELD) as string | undefined,
    type: getCustomFieldValue(issue.customFields, "Type") as string | undefined,
    state: getCustomFieldValue(issue.customFields, "State") as string | undefined,
    assignee: assignee as { id: string; name: string; avatarUrl?: string } | undefined,
    estimation: getCustomFieldValue(issue.customFields, "Estimation") as string | undefined,
    dueDate: getCustomFieldValue(issue.customFields, "Due Date") as Date | undefined,
    priority: getCustomFieldValue(issue.customFields, "Priority") as string | undefined,
  };
}

// Check if comment is public
function isPublicComment(comment: YouTrackComment): boolean {
  if (!comment.visibility?.permittedGroups) {
    return true; // No visibility restriction = public
  }
  const groups = comment.visibility.permittedGroups.map((g) => g.name);
  return groups.length === 0 || groups.some((g) => PUBLIC_GROUPS.includes(g));
}

// Transform YouTrack comment to CCS comment
function transformComment(comment: YouTrackComment): CCSComment {
  return {
    id: comment.id,
    text: comment.text,
    created: new Date(comment.created),
    updated: comment.updated ? new Date(comment.updated) : undefined,
    author: {
      id: comment.author.id,
      name: comment.author.fullName,
      avatarUrl: comment.author.avatarUrl,
    },
    isPublic: isPublicComment(comment),
  };
}

// Fields to request from YouTrack
const ISSUE_FIELDS = [
  "id",
  "idReadable",
  "summary",
  "description",
  "created",
  "updated",
  "resolved",
  "reporter(id,login,fullName,avatarUrl)",
  "updatedBy(id,login,fullName,avatarUrl)",
  "customFields(id,name,value(id,name,fullName,avatarUrl,presentation),$type)",
].join(",");

const COMMENT_FIELDS = [
  "id",
  "text",
  "created",
  "updated",
  "author(id,login,fullName,avatarUrl)",
  "visibility(permittedGroups(id,name),$type)",
].join(",");

// YouTrack Service
export const YouTrackService = {
  // Get tickets for a specific client
  async getTickets(clientValue: string): Promise<CCSTicket[]> {
    const query = encodeURIComponent(`${YOUTRACK_CLIENT_FIELD}: {${clientValue}}`);
    const issues = await youtrackFetch<YouTrackIssue[]>(
      `/issues?query=${query}&fields=${ISSUE_FIELDS}&$top=1000`
    );
    return issues.map(transformIssue);
  },

  // Get a single ticket by ID
  async getTicket(issueId: string): Promise<CCSTicket> {
    const issue = await youtrackFetch<YouTrackIssue>(
      `/issues/${issueId}?fields=${ISSUE_FIELDS}`
    );
    return transformIssue(issue);
  },

  // Create a new ticket
  async createTicket(
    clientValue: string,
    data: z.infer<typeof CreateTicketSchema>
  ): Promise<CCSTicket> {
    const customFields: Array<{ name: string; $type: string; value: unknown }> = [
      {
        name: YOUTRACK_CLIENT_FIELD,
        $type: "SingleEnumIssueCustomField",
        value: { name: clientValue },
      },
    ];

    if (data.type) {
      customFields.push({
        name: "Type",
        $type: "SingleEnumIssueCustomField",
        value: { name: data.type },
      });
    }

    if (data.assignee) {
      customFields.push({
        name: "Assignee",
        $type: "SingleUserIssueCustomField",
        value: { id: data.assignee },
      });
    }

    const issue = await youtrackFetch<YouTrackIssue>(`/issues?fields=${ISSUE_FIELDS}`, {
      method: "POST",
      body: JSON.stringify({
        project: { id: YOUTRACK_PROJECT_ID },
        summary: data.summary,
        description: data.description,
        customFields,
      }),
    });

    return transformIssue(issue);
  },

  // Update a ticket
  async updateTicket(
    issueId: string,
    data: z.infer<typeof UpdateTicketSchema>
  ): Promise<CCSTicket> {
    const updates: Record<string, unknown> = {};
    const customFields: Array<{ name: string; $type: string; value: unknown }> = [];

    if (data.summary) {
      updates.summary = data.summary;
    }

    if (data.description !== undefined) {
      updates.description = data.description;
    }

    if (data.type) {
      customFields.push({
        name: "Type",
        $type: "SingleEnumIssueCustomField",
        value: { name: data.type },
      });
    }

    if (data.state) {
      customFields.push({
        name: "State",
        $type: "StateIssueCustomField",
        value: { name: data.state },
      });
    }

    if (data.assignee) {
      customFields.push({
        name: "Assignee",
        $type: "SingleUserIssueCustomField",
        value: { id: data.assignee },
      });
    }

    if (customFields.length > 0) {
      updates.customFields = customFields;
    }

    const issue = await youtrackFetch<YouTrackIssue>(
      `/issues/${issueId}?fields=${ISSUE_FIELDS}`,
      {
        method: "POST",
        body: JSON.stringify(updates),
      }
    );

    return transformIssue(issue);
  },

  // Get comments for a ticket (only public ones)
  async getComments(issueId: string): Promise<CCSComment[]> {
    const comments = await youtrackFetch<YouTrackComment[]>(
      `/issues/${issueId}/comments?fields=${COMMENT_FIELDS}`
    );
    return comments.filter(isPublicComment).map(transformComment);
  },

  // Add a comment to a ticket
  async addComment(
    issueId: string,
    text: string
  ): Promise<CCSComment> {
    const comment = await youtrackFetch<YouTrackComment>(
      `/issues/${issueId}/comments?fields=${COMMENT_FIELDS}`,
      {
        method: "POST",
        body: JSON.stringify({ text }),
      }
    );

    return transformComment(comment);
  },

  // Get available assignees for a project
  async getAssignees(): Promise<Array<{ id: string; name: string; avatarUrl?: string }>> {
    interface AssigneesResponse {
      aggregatedUsers?: Array<{
        id: string;
        fullName: string;
        avatarUrl?: string;
      }>;
    }

    const response = await youtrackFetch<AssigneesResponse>(
      `/admin/projects/${YOUTRACK_PROJECT_ID}/customFields/Assignee?fields=aggregatedUsers(id,fullName,avatarUrl)`
    );

    return (response.aggregatedUsers || []).map((user) => ({
      id: user.id,
      name: user.fullName,
      avatarUrl: user.avatarUrl,
    }));
  },

  // Get available states
  async getStates(): Promise<string[]> {
    interface StatesResponse {
      bundle?: {
        values?: Array<{ name: string }>;
      };
    }

    const response = await youtrackFetch<StatesResponse>(
      `/admin/projects/${YOUTRACK_PROJECT_ID}/customFields/State?fields=bundle(values(name))`
    );

    return (response.bundle?.values || []).map((v) => v.name);
  },

  // Get available types
  async getTypes(): Promise<string[]> {
    interface TypesResponse {
      bundle?: {
        values?: Array<{ name: string }>;
      };
    }

    const response = await youtrackFetch<TypesResponse>(
      `/admin/projects/${YOUTRACK_PROJECT_ID}/customFields/Type?fields=bundle(values(name))`
    );

    return (response.bundle?.values || []).map((v) => v.name);
  },
};

export default YouTrackService;
