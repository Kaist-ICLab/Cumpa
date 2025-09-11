import ast
import logging


class MermaidFlowGenerator(ast.NodeVisitor):
    def __init__(self):
        self.lines = ["flowchart TD"]
        self.counter = 0
        self.func_defs = {}
        self.start_node = "Trigger"
        self.lines.append(f"{self.start_node}[{self.start_node}]")
        self.prev_node = self.start_node

    def unique_id(self, base):
        self.counter += 1
        return f"{base}_{self.counter}"

    def _get_code(self, node):
        return ast.unparse(node).strip()

    def _get_comparison_value(self, node):
        if isinstance(node, ast.Compare):
            if len(node.comparators) == 1 and isinstance(
                node.comparators[0], ast.Constant
            ):
                return node.comparators[0].value
        return None

    def _visit_statements(self, stmts, entry_point=False):
        """Processes a list of statements and returns the last node's ID."""
        print(f"[_visit_statements] previous node: {self.prev_node}")
        first_node = None
        last_node = self.prev_node
        for stmt in stmts:
            last_node = self.prev_node
            print(
                f"[_visit_statements] Processing statement: {ast.dump(stmt)}"
            )  # hands_as_thoughts
            current_node = self.visit(
                stmt
            )  # If, Expr 등등 유형에 따라 다르게 처리해서 current node를 리턴함
            if current_node:
                if first_node is None:
                    first_node = current_node
                # If not entry point, connect last node to current node
                if not entry_point and not str(current_node).startswith("Exit"):
                    if last_node:
                        print(
                            f"[_visit_statements] current_node: {current_node}, last_node: {last_node}"
                        )
                        print(
                            f"[_visit_statements] Connecting {last_node} to {current_node}"
                        )
                        self.lines.append(f"{last_node} --> {current_node}")
                # If it's an entry point of If or FunctionDef, do not connect to previous node
                # Prevents double connection in If or previous node being included in FunctionDef
                else:
                    entry_point = False
                last_node = current_node
                self.prev_node = current_node
        print(f"[_visit_statements] Returning last node: {last_node}")
        return first_node, last_node

    # Main traversal methods
    def visit_Module(self, node):
        # Build function definitions
        for stmt in node.body:
            if isinstance(stmt, ast.FunctionDef):
                self.func_defs[stmt.name] = stmt

        # Process main body
        main_stmts = [
            stmt for stmt in node.body if not isinstance(stmt, ast.FunctionDef)
        ]

        self._visit_statements(main_stmts)

    def visit_Expr(self, node):
        # Function call
        if isinstance(node.value, ast.Call) and isinstance(
            node.value.func, ast.Name
        ):  # Function call
            fname = node.value.func.id
            if fname in self.func_defs:
                return self._build_function_subgraph(self.func_defs[fname])

        # Yield statement
        elif isinstance(node.value, ast.Yield):
            return self._yield_target(node.value)
        return None

    def visit_If(self, node):
        print(f"[visit_If] Processing If statement")
        # Condition Label
        comp_value = self._get_comparison_value(node.test)
        if_stmt = (
            "good mood"
            if comp_value == "positive"
            else "bad mood" if comp_value == "negative" else "neutral"
        )
        true_label = f'"{if_stmt}"' if comp_value else "True"
        false_label = f"else" if comp_value else "False"

        entry_node = self.prev_node  # Save the previous node

        # True branch
        self.prev_node = entry_node
        first_true_node, last_true_node = self._visit_statements(
            node.body, entry_point=True
        )  # Dandelion

        # If "else" exists, process false branch
        last_false_node = None
        if node.orelse:
            self.prev_node = entry_node
            first_false_node, last_false_node = self._visit_statements(
                node.orelse, entry_point=True
            )  # five_senses

        # Exit node
        exit_node = self.unique_id("Exit")

        # Connect nodes
        if last_true_node:
            self.lines.append(f'{entry_node} --> |"{true_label}"| {first_true_node}')
            self.lines.append(f"{last_true_node} --> {exit_node}")
        if last_false_node:
            self.lines.append(f'{entry_node} --> |"{false_label}"| {first_false_node}')
            self.lines.append(f"{last_false_node} --> {exit_node}")

        self.prev_node = exit_node
        return exit_node

    def _build_function_subgraph(self, fdef):
        self.lines.append(f"subgraph {fdef.name}")
        print(f"[visit_Expr] Building subgraph for function: {fdef.name}")
        self._visit_statements(fdef.body, entry_point=True)
        self.lines.append("end")
        return fdef.name  # Return the function name as the node ID

    def _yield_target(self, yield_node):
        if isinstance(yield_node.value, ast.Constant):
            name = yield_node.value.value
        else:
            name = "Unknown"
        safe = self.unique_id(name.replace(" ", "_"))
        self.lines.append(f"{safe}[{name}]")
        return safe

    def generic_visit(self, node):
        # Default behavior: visit children.
        # This is overridden by other visit_ methods.
        pass


def generate_mermaid_text(code):
    try:
        tree = ast.parse(code)
    except SyntaxError as e:
        raise ValueError(f"Invalid Python code: {e}")

    generator = MermaidFlowGenerator()
    generator.visit(tree)
    return "\n".join(generator.lines)
