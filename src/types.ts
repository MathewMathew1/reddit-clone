export enum VoteEnum {
    UP = 'UP',
    DOWN = 'DOWN',
}

export enum SortMethodEnum  {
    TIME = "Newest",
    VOTES = "Best Voted"
}

export type PostType = {
    voteCount: number;
    yourVote: number;
    id: string;
    title: string;
    imageLink: string | null;
    description: string;
    commentsAmount: number;
    createdAt: Date;
    community: {
        id: string;
        name: string;
        description: string;
        createdAt: Date;
        creatorId: string;
    };
    numberOfVotes: number;
    author: { id: string; image: string | null; name: string | null, username: string | null; };
};
  