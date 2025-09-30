import { pgChatRepository } from "./pg/repositories/chat-repository.pg";
import { pgUserRepository } from "./pg/repositories/user-repository.pg";
import { pgArchiveRepository } from "./pg/repositories/archive-repository.pg";

export const chatRepository = pgChatRepository;
export const userRepository = pgUserRepository;

export const archiveRepository = pgArchiveRepository;
