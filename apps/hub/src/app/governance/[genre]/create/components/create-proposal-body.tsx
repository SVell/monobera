import { Button } from "@bera/ui/button";

import { InputWithLabel } from "@bera/ui/input";
import { TextArea } from "@bera/ui/text-area";
import { Dispatch, SetStateAction, useCallback } from "react";
import {
  CustomProposal,
  CustomProposalErrors,
  ProposalErrorCodes,
} from "~/app/governance/types";
import {
  checkProposalField,
  type useCreateProposal,
} from "~/hooks/useCreateProposal";
import { useGovernance } from "../../components/governance-provider";

export const CreateProposalBody = ({
  proposal,
  setProposal,
  errors,
  setErrors,
  onNext,
}: {
  proposal: CustomProposal;
  setProposal: ReturnType<typeof useCreateProposal>["setProposal"];
  onNext: () => void;
  errors: CustomProposalErrors;
  setErrors: Dispatch<SetStateAction<CustomProposalErrors>>;
}) => {
  const { currentTopic } = useGovernance();
  const handleNext = useCallback(() => {
    const e: CustomProposalErrors = {};

    e.title = checkProposalField({
      fieldOrType: "title",
      value: proposal.title,
    });
    e.description = checkProposalField({
      fieldOrType: "description",
      value: proposal.description,
    });
    e.forumLink = checkProposalField({
      fieldOrType: "forumLink",
      value: proposal.forumLink,
      baseUrl: currentTopic.forumLink,
    });

    setErrors(e);

    if (e.title || e.description || e.forumLink) {
      return;
    }

    onNext();
  }, [onNext]);

  return (
    <div className="grid grid-cols-1 justify-start gap-6">
      <InputWithLabel
        label="Title"
        error={
          errors.title === ProposalErrorCodes.REQUIRED
            ? "Title must be filled"
            : errors.title
        }
        variant="black"
        type="text"
        id="proposal-title"
        placeholder="Ooga booga"
        value={proposal.title}
        onChange={(e) =>
          setProposal((prev: any) => ({
            ...prev,
            title: e.target.value,
          }))
        }
      />

      <TextArea
        id="proposal-message"
        label="Description"
        error={
          errors.description === ProposalErrorCodes.REQUIRED
            ? "Description must be filled"
            : errors.description
        }
        variant="black"
        placeholder="Tell us about your proposal"
        value={proposal.description}
        onChange={(e) =>
          setProposal((prev: any) => ({
            ...prev,
            description: e.target.value,
          }))
        }
      />

      <InputWithLabel
        label="Forum Link"
        error={
          errors.forumLink === ProposalErrorCodes.REQUIRED
            ? "Forum link must be filled"
            : errors.forumLink === ProposalErrorCodes.INVALID_ADDRESS
              ? "Invalid URL"
              : errors.forumLink === ProposalErrorCodes.MUST_BE_HTTPS
                ? "Forum link must start with HTTPS"
                : errors.forumLink
        }
        type="text"
        variant="black"
        id="proposal-forumLink"
        placeholder={`${currentTopic.forumLink}...`}
        value={proposal.forumLink}
        onChange={(e: any) => {
          setProposal((prev: any) => ({
            ...prev,
            forumLink: e.target.value,
          }));
          setErrors((errs) => ({
            ...errs,
            forumLink: checkProposalField({
              fieldOrType: "forumLink",
              value: e.target.value,
              baseUrl: currentTopic.forumLink,
            }),
          }));
        }}
      />

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
};
