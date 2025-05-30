import { Forms } from "@vendetta/ui/components";
import { findInReactTree } from "@vendetta/utils";
import { before } from "@vendetta/patcher";
import { findByProps } from "@vendetta/metro";
import { findByDisplayName } from "@vendetta/metro";
import { findByDisplayNameAll } from "@vendetta/metro";
const { FormText } = Forms;

export default () => (
    <FormText>
        Hello, world!
    </FormText>
)