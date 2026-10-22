import { deleteMemoryRuleAPI, deleteMemoryNodeAPI, searchMemoryAPI, createMemoryRuleAPI, getMemoryRulesAPI } from "../api/memory.api";

export const useMemory = () => {
  const deleteMemoryNode = async (communicationIds, profile_id) => {
    return await deleteMemoryNodeAPI(communicationIds, profile_id);
  }

  const searchMemory = async (profile_id, query, filters = {}, limit = 25, offset = 0) => {
    return await searchMemoryAPI(profile_id, query, filters, limit, offset);
  }

  const createMemoryRule = async (profile_id, type, scope, value) => {
    return await createMemoryRuleAPI(profile_id, type, scope, value);
  }

  const getMemoryRules = async (profile_id) => {
    return await getMemoryRulesAPI(profile_id);
  }

  const deleteMemoryRule = async (profile_id, rule_id) => {
    return await deleteMemoryRuleAPI(profile_id, rule_id);
  }

  return { deleteMemoryNode, searchMemory, createMemoryRule, getMemoryRules, deleteMemoryRule };
}
